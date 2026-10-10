/**
 * Read-aloud player: turns the rendered book into spoken paragraphs.
 *
 * Flow
 * 1. The foliate view emits a `load` event per rendered section with its
 *    iframe Document. We keep that doc + section index.
 * 2. Starting (paragraph hover or TOC chapter) unlocks the shared <audio>
 *    element inside the user gesture, resolves the chapter scope, and builds
 *    an ordered queue of paragraphs with `extractParagraphs(doc)`.
 * 3. Playing index N asks SpeechCache for a blob URL. The cache returns a
 *    cached URL, joins an in-flight request, or calls `generateSpeech`
 *    (OpenAI-compatible /audio/speech). The next paragraph is prefetched while
 *    N plays, so gaps stay small.
 * 4. The URL is set on the <audio> element and played; the paragraph's Range is
 *    highlighted via the CSS Custom Highlight API and scrolled into view.
 * 5. On `ended`, advance to N+1. After the last paragraph, the player goes to
 *    the next section in the scope and continues, or shows "Chapter finished".
 * 6. Stop aborts in-flight requests and keeps cached URLs; unmount revokes
 *    every blob URL.
 *
 * Navigation belongs to the player while it is active.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { FoliateView } from "../types";
import { useStore } from "../store/useStore";
import { useChapterScopeDepth } from "./useChapterScopeDepth";
import { useParagraphHighlight } from "./useParagraphHighlight";
import { useSpeechSettings } from "./useSpeechSettings";
import { SpeechCache } from "../services/speechCache";
import { SpeechAudio } from "../services/speechAudio";
import { LLMServiceError, formatLLMError } from "../services/llmClient";
import {
  extractParagraphs,
  paragraphRange,
  type ReadAloudParagraph,
} from "../utils/ttsChunker";
import {
  computeChapterScope,
  flattenTocWithDepth,
  type ChapterScope,
} from "../utils/tocUtils";

/** How long a paragraph must play before the next one is prefetched. */
const PREFETCH_DELAY_MS = 800;

export type ReadAloudStatus =
  "idle" | "loading" | "playing" | "paused" | "chapterEnd" | "error";

export interface ReadAloudPlayer {
  status: ReadAloudStatus;
  error: string | null;
  isActive: boolean;
  canPrev: boolean;
  canNext: boolean;
  /** Starts reading at a paragraph range, e.g. from the hover affordance. */
  startFrom: (range: Range) => void;
  /** Navigates to a chapter href and starts reading its first paragraph. */
  startChapter: (href: string) => void;
  toggle: () => void;
  pause: () => void;
  prev: () => void;
  next: () => void;
  stop: () => void;
  retry: () => void;
  nextChapter: () => void;
}

interface UseReadAloudOptions {
  viewRef: React.MutableRefObject<FoliateView | null>;
  /** True once the foliate view exists and the book is open. */
  ready: boolean;
}

/**
 * Reads the current chapter aloud, paragraph by paragraph, through the
 * configured speech provider. Navigation belongs to the player while it runs.
 */
export function useReadAloud({
  viewRef,
  ready,
}: UseReadAloudOptions): ReadAloudPlayer {
  const book = useStore((state) => state.book);
  const currentBookId = useStore((state) => state.currentBookId) ?? null;
  const currentTocHref = useStore((state) => state.currentTocHref);
  const chapterScopeDepth = useChapterScopeDepth();
  const speechSettings = useSpeechSettings();

  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [currentRange, setCurrentRange] = useState<Range | null>(null);

  const statusRef = useRef<ReadAloudStatus>("idle");
  const queueRef = useRef<ReadAloudParagraph[]>([]);
  const indexRef = useRef(-1);
  const docRef = useRef<Document | null>(null);
  const sectionIndexRef = useRef<number | null>(null);
  const scopeRef = useRef<ChapterScope | null>(null);
  const pendingRef = useRef<{
    kind: "start" | "continue";
    href: string | null;
  } | null>(null);
  const tokenRef = useRef(0);
  const audioRef = useRef<SpeechAudio | null>(null);
  const cacheRef = useRef<SpeechCache | null>(null);
  const paragraphsCacheRef = useRef<WeakMap<Document, ReadAloudParagraph[]>>(
    new WeakMap()
  );
  const advanceRef = useRef<() => void>(() => {});
  const followRef = useRef<((range: Range) => void) | null>(null);
  const prefetchTimerRef = useRef<number | null>(null);

  const stateRef = useRef({
    book,
    currentTocHref,
    chapterScopeDepth,
    speechSettings,
  });
  useEffect(() => {
    stateRef.current = {
      book,
      currentTocHref,
      chapterScopeDepth,
      speechSettings,
    };
  }, [book, currentTocHref, chapterScopeDepth, speechSettings]);

  const updateStatus = useCallback((next: ReadAloudStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const fail = useCallback(
    (message: string) => {
      updateStatus("error");
      setError(message);
    },
    [updateStatus]
  );

  const getAudio = useCallback((): SpeechAudio => {
    if (!audioRef.current) {
      audioRef.current = new SpeechAudio(() => advanceRef.current());
    }
    return audioRef.current;
  }, []);

  const getCache = useCallback((): SpeechCache => {
    if (!cacheRef.current) cacheRef.current = new SpeechCache();
    return cacheRef.current;
  }, []);

  /**
   * Warms the first paragraph of the next section while the last paragraph of
   * the current one plays, so the chapter transition has no synthesis pause.
   */
  const warmNextSection = useCallback(async () => {
    const state = stateRef.current;
    const scope = scopeRef.current;
    const section = sectionIndexRef.current;
    const nextSection =
      state.book?.sections && section !== null && scope && section < scope.end
        ? state.book.sections[section + 1]
        : undefined;
    const settings = state.speechSettings;
    if (!nextSection?.createDocument || !settings) return;

    const token = tokenRef.current;
    try {
      const doc = await nextSection.createDocument();
      const [first] = extractParagraphs(doc);
      if (!first) return;
      const url = await getCache().get(first, settings, currentBookId);
      if (token !== tokenRef.current) return;
      getAudio().preload(url);
    } catch {
      // Warm-up is best-effort; the normal path fetches on arrival.
    }
  }, [currentBookId, getAudio, getCache]);

  const clearPrefetchTimer = useCallback(() => {
    if (prefetchTimerRef.current !== null) {
      window.clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = null;
    }
  }, []);

  /**
   * Prefetches the next paragraph only after the current one has actually been
   * playing for a moment. Starting a request per skip would bill audio the
   * reader never hears.
   */
  const schedulePrefetch = useCallback(
    (index: number) => {
      clearPrefetchTimer();
      const token = tokenRef.current;
      prefetchTimerRef.current = window.setTimeout(() => {
        prefetchTimerRef.current = null;
        if (token !== tokenRef.current || statusRef.current !== "playing") {
          return;
        }
        const paragraph = queueRef.current[index];
        const settings = stateRef.current.speechSettings;
        if (!settings) return;
        if (!paragraph) {
          void warmNextSection();
          return;
        }
        void getCache()
          .prefetch(paragraph, settings, currentBookId)
          .then((url) => {
            if (!url) return;
            if (token !== tokenRef.current || statusRef.current !== "playing") {
              return;
            }
            getAudio().preload(url);
          });
      }, PREFETCH_DELAY_MS);
    },
    [clearPrefetchTimer, currentBookId, getAudio, getCache, warmNextSection]
  );

  const buildQueue = useCallback((doc: Document): ReadAloudParagraph[] => {
    let queue = paragraphsCacheRef.current.get(doc);
    if (!queue) {
      queue = extractParagraphs(doc);
      paragraphsCacheRef.current.set(doc, queue);
    }
    queueRef.current = queue;
    setParagraphCount(queue.length);
    return queue;
  }, []);

  const findParagraphIndex = useCallback(
    (queue: ReadAloudParagraph[], target: Range): number => {
      let found = 0;
      for (let i = 0; i < queue.length; i++) {
        if (
          queue[i].range.compareBoundaryPoints(Range.START_TO_START, target) <=
          0
        ) {
          found = i;
        } else {
          break;
        }
      }
      return found;
    },
    []
  );

  const finishQueue = useCallback(() => {
    const view = viewRef.current;
    const section = sectionIndexRef.current;
    const scope = scopeRef.current;

    if (view && section !== null && scope && section < scope.end) {
      pendingRef.current = { kind: "continue", href: null };
      updateStatus("loading");
      void view.goTo(section + 1);
      return;
    }

    setCurrentRange(null);
    updateStatus("chapterEnd");
  }, [updateStatus, viewRef]);

  const playIndex = useCallback(
    async (index: number) => {
      const token = ++tokenRef.current;
      const queue = queueRef.current;

      if (queue.length === 0) {
        finishQueue();
        return;
      }
      if (index < 0) index = 0;
      if (index >= queue.length) {
        finishQueue();
        return;
      }

      indexRef.current = index;
      setParagraphIndex(index);
      setError(null);

      const paragraph = queue[index];
      setCurrentRange(paragraph.range);
      updateStatus("loading");

      const settings = stateRef.current.speechSettings;
      if (!settings) {
        fail("Speech is not configured. Add a speech provider in Settings.");
        return;
      }

      let url: string;
      try {
        url = await getCache().get(paragraph, settings, currentBookId);
      } catch (err) {
        if (token !== tokenRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        fail(
          err instanceof LLMServiceError ? err.message : formatLLMError(err)
        );
        return;
      }
      if (!url || token !== tokenRef.current) return;

      try {
        await getAudio().play(url);
        if (token !== tokenRef.current) return;
        updateStatus("playing");
        followRef.current?.(paragraph.range);
        schedulePrefetch(index + 1);
      } catch (err) {
        if (token !== tokenRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        fail("Could not play the audio. Try again.");
      }
    },
    [
      currentBookId,
      fail,
      finishQueue,
      getAudio,
      getCache,
      schedulePrefetch,
      updateStatus,
    ]
  );

  const advance = useCallback(() => {
    const next = indexRef.current + 1;
    if (next < queueRef.current.length) void playIndex(next);
    else finishQueue();
  }, [finishQueue, playIndex]);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  const handleLoad = useCallback(
    (event: Event) => {
      const { doc, index } = (event as CustomEvent).detail as {
        doc?: Document;
        index?: number;
      };
      if (!doc || typeof index !== "number") return;

      docRef.current = doc;
      sectionIndexRef.current = index;

      const pending = pendingRef.current;
      if (pending?.kind === "continue") {
        pendingRef.current = null;
        buildQueue(doc);
        void playIndex(0);
        return;
      }

      if (pending?.kind === "start") {
        pendingRef.current = null;
        const queue = buildQueue(doc);
        const href = pending.href;

        let startIndex = 0;
        const resolved = href
          ? stateRef.current.book?.resolveHref?.(href)
          : null;
        const anchor = resolved?.anchor?.(doc);
        if (anchor instanceof Element) {
          startIndex = findParagraphIndex(queue, paragraphRange(doc, anchor));
        }
        void playIndex(startIndex);
      }
    },
    [buildQueue, findParagraphIndex, playIndex]
  );

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !ready) return;
    view.addEventListener("load", handleLoad);
    return () => view.removeEventListener("load", handleLoad);
  }, [viewRef, ready, handleLoad]);

  // Follow the spoken paragraph: scroll/page it into view on paragraph change.
  useEffect(() => {
    followRef.current = (range: Range) => {
      const renderer = viewRef.current?.renderer;
      if (renderer?.scrollToAnchor) void renderer.scrollToAnchor(range);
    };
    return () => {
      followRef.current = null;
    };
  }, [viewRef]);

  // Highlight the paragraph being read, where the browser supports it.
  useParagraphHighlight(currentRange);

  useEffect(() => {
    return () => {
      clearPrefetchTimer();
      cacheRef.current?.dispose();
      audioRef.current?.dispose();
    };
  }, [clearPrefetchTimer]);

  const beginAtSection = useCallback(
    (sectionIndex: number, href: string | null) => {
      const view = viewRef.current;
      const state = stateRef.current;
      if (!view) return;

      getAudio().unlock();
      getAudio().stop();
      tokenRef.current++;

      if (!href) {
        const found = state.book?.toc
          ? flattenTocWithDepth(state.book.toc).find(
              (entry) =>
                state.book?.resolveHref?.(entry.href)?.index === sectionIndex
            )
          : undefined;
        href = found?.href ?? null;
      }

      scopeRef.current = href
        ? computeChapterScope(
            state.book,
            state.book?.toc,
            href,
            state.chapterScopeDepth
          )
        : { start: sectionIndex, end: (state.book?.sections?.length ?? 1) - 1 };

      const doc = docRef.current;
      if (doc && sectionIndexRef.current === sectionIndex) {
        const queue = buildQueue(doc);
        let startIndex = 0;
        const resolved = href ? state.book?.resolveHref?.(href) : null;
        const anchor = resolved?.anchor?.(doc);
        if (anchor instanceof Element) {
          startIndex = findParagraphIndex(queue, paragraphRange(doc, anchor));
        }
        void playIndex(startIndex);
        return;
      }

      pendingRef.current = { kind: "start", href };
      updateStatus("loading");
      void view.goTo(sectionIndex);
    },
    [buildQueue, findParagraphIndex, getAudio, playIndex, updateStatus, viewRef]
  );

  const startFrom = useCallback(
    (range: Range) => {
      const doc = range.startContainer.ownerDocument;
      if (!doc) return;

      const state = stateRef.current;
      getAudio().unlock();
      getAudio().stop();
      tokenRef.current++;

      docRef.current = doc;
      scopeRef.current = computeChapterScope(
        state.book,
        state.book?.toc,
        state.currentTocHref,
        state.chapterScopeDepth
      );

      const queue = buildQueue(doc);
      const startIndex = findParagraphIndex(queue, range);
      void playIndex(startIndex);
    },
    [buildQueue, findParagraphIndex, getAudio, playIndex]
  );

  const startChapter = useCallback(
    (href: string) => {
      const state = stateRef.current;
      const resolved = state.book?.resolveHref?.(href);
      if (!resolved) return;
      beginAtSection(resolved.index, href);
    },
    [beginAtSection]
  );

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") return;
    clearPrefetchTimer();
    audioRef.current?.pause();
    updateStatus("paused");
  }, [clearPrefetchTimer, updateStatus]);

  const toggle = useCallback(() => {
    if (statusRef.current === "playing") {
      pause();
      return;
    }

    if (statusRef.current === "paused") {
      const audio = getAudio();
      audio.unlock();
      audio
        .resume()
        .then(() => {
          updateStatus("playing");
          schedulePrefetch(indexRef.current + 1);
        })
        .catch(() => fail("Could not resume the audio. Try again."));
      return;
    }

    if (statusRef.current === "error") {
      void playIndex(indexRef.current);
    }
  }, [fail, getAudio, pause, playIndex, schedulePrefetch, updateStatus]);

  const prev = useCallback(() => {
    clearPrefetchTimer();
    if (indexRef.current > 0) void playIndex(indexRef.current - 1);
  }, [clearPrefetchTimer, playIndex]);

  const next = useCallback(() => {
    clearPrefetchTimer();
    const target = indexRef.current + 1;
    if (target < queueRef.current.length) void playIndex(target);
    else finishQueue();
  }, [clearPrefetchTimer, finishQueue, playIndex]);

  const retry = useCallback(() => {
    void playIndex(indexRef.current);
  }, [playIndex]);

  const stop = useCallback(() => {
    tokenRef.current++;
    pendingRef.current = null;
    clearPrefetchTimer();
    getCache().abortAll();
    getAudio().stop();
    queueRef.current = [];
    indexRef.current = -1;
    setParagraphIndex(0);
    setParagraphCount(0);
    setCurrentRange(null);
    setError(null);
    updateStatus("idle");
  }, [clearPrefetchTimer, getAudio, getCache, updateStatus]);

  const nextChapter = useCallback(() => {
    const scope = scopeRef.current;
    const state = stateRef.current;
    if (!scope || !state.book?.sections?.length) {
      stop();
      return;
    }
    const target = scope.end + 1;
    if (target >= state.book.sections.length) {
      stop();
      return;
    }
    beginAtSection(target, null);
  }, [beginAtSection, stop]);

  return {
    status,
    error,
    isActive: status !== "idle",
    canPrev: paragraphIndex > 0,
    canNext: paragraphCount > 0,
    startFrom,
    startChapter,
    toggle,
    pause,
    prev,
    next,
    stop,
    retry,
    nextChapter,
  };
}

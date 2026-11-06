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
 *    (OpenAI-compatible /audio/speech). A read-ahead window keeps about 30
 *    seconds of upcoming paragraphs synthesized while N plays, so gaps stay
 *    small.
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
import type { BookSection, FoliateView } from "../types";
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

/**
 * How long a paragraph must play before read-ahead starts. The short delay
 * debounces skip clicks, so holding next does not synthesize a paragraph per
 * click.
 */
const PREFETCH_DELAY_MS = 250;

/**
 * How much playable audio to keep synthesized beyond the current paragraph.
 * Long paragraphs reach the target with one paragraph ahead; runs of short
 * lines get more paragraphs, up to the cap.
 */
const PREFETCH_TARGET_SECONDS = 30;

/** Upper bound on paragraphs generated ahead, to cap cost on short lines. */
const PREFETCH_MAX_PARAGRAPHS = 5;

/** Rough speech pace used to estimate paragraph duration before it is fetched. */
const SPEECH_CHARS_PER_SECOND = 14;

function estimateSpeechSeconds(text: string, rate: number): number {
  return Math.max(
    text.length / (SPEECH_CHARS_PER_SECOND * Math.max(rate, 0.6)),
    1
  );
}

export type ReadAloudStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "chapterEnd"
  | "error";

export interface ReadAloudPlayer {
  status: ReadAloudStatus;
  error: string | null;
  isActive: boolean;
  /** Zero-based paragraph currently being read. */
  paragraphIndex: number;
  /** Number of paragraphs in the current section queue. */
  paragraphCount: number;
  /** Current audio playback speed, between 0.6 and 1.6. */
  playbackRate: number;
  /** Changes playback speed immediately and persists the choice. */
  setPlaybackRate: (rate: number) => void;
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
  const playbackRate = useStore((state) => state.settings.playbackRate ?? 1);
  const updateSettings = useStore((state) => state.updateSettings);
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
  const readAheadRunRef = useRef(0);
  const nextSectionTextsRef = useRef(
    new WeakMap<BookSection, Promise<string[]>>()
  );
  const rateRef = useRef(playbackRate);

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

  // Keep the audio elements in sync with the persisted playback speed.
  useEffect(() => {
    rateRef.current = playbackRate;
    audioRef.current?.setRate(playbackRate);
  }, [playbackRate]);

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
      audioRef.current.setRate(rateRef.current);
    }
    return audioRef.current;
  }, []);

  const getCache = useCallback((): SpeechCache => {
    if (!cacheRef.current) cacheRef.current = new SpeechCache();
    return cacheRef.current;
  }, []);

  /**
   * Paragraph texts of a later section, extracted without rendering it. Only
   * text is needed for synthesis, so the created document can be released
   * after extraction and is never held by the read-ahead cache.
   */
  const loadSectionTexts = useCallback(
    (section: BookSection): Promise<string[]> => {
      const cached = nextSectionTextsRef.current.get(section);
      if (cached) return cached;

      const pending = section
        .createDocument()
        .then((doc) =>
          extractParagraphs(doc).map((paragraph) => paragraph.text)
        );
      nextSectionTextsRef.current.set(section, pending);
      void pending.catch(() => {
        // Let a later fill retry a section that failed to parse.
        nextSectionTextsRef.current.delete(section);
      });
      return pending;
    },
    []
  );

  const clearPrefetchTimer = useCallback(() => {
    if (prefetchTimerRef.current !== null) {
      window.clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = null;
    }
  }, []);

  /**
   * Stops scheduling read-ahead work. In-flight requests are left running:
   * they finish into the cache and are useful after a pause or a skip.
   */
  const cancelReadAhead = useCallback(() => {
    clearPrefetchTimer();
    readAheadRunRef.current += 1;
  }, [clearPrefetchTimer]);

  /**
   * Synthesizes upcoming paragraphs until about `PREFETCH_TARGET_SECONDS` of
   * audio is buffered, or `PREFETCH_MAX_PARAGRAPHS` is reached. Runs one
   * request at a time so the immediate next paragraph is ready first; the
   * cache dedupes requests a previous fill already started.
   */
  const fillReadAhead = useCallback(
    async (startIndex: number, token: number, run: number) => {
      const settings = stateRef.current.speechSettings;
      if (!settings) return;

      const queue = queueRef.current;
      const isCurrent = () =>
        token === tokenRef.current &&
        run === readAheadRunRef.current &&
        statusRef.current === "playing";

      let buffered = 0;
      let fetched = 0;

      for (
        let index = startIndex + 1;
        index < queue.length &&
        fetched < PREFETCH_MAX_PARAGRAPHS &&
        buffered < PREFETCH_TARGET_SECONDS;
        index++, fetched++
      ) {
        const paragraph = queue[index];
        buffered += estimateSpeechSeconds(paragraph.text, rateRef.current);
        const url = await getCache().prefetch(
          paragraph.text,
          settings,
          currentBookId
        );
        if (!isCurrent()) return;
        if (url && index === startIndex + 1) getAudio().preload(url);
      }

      // Once the remaining current-section audio is short, prepare the next
      // section too, so a chapter transition gets the same head start.
      const remaining = queue
        .slice(startIndex + 1)
        .reduce(
          (sum, paragraph) =>
            sum + estimateSpeechSeconds(paragraph.text, rateRef.current),
          0
        );
      if (remaining >= PREFETCH_TARGET_SECONDS) return;

      const state = stateRef.current;
      const section = sectionIndexRef.current;
      const scope = scopeRef.current;
      if (
        !state.book?.sections ||
        section === null ||
        !scope ||
        section >= scope.end
      ) {
        return;
      }
      const nextSection = state.book.sections[section + 1];
      if (!nextSection?.createDocument) return;

      let texts: string[];
      try {
        texts = await loadSectionTexts(nextSection);
      } catch {
        // The rendered section fetches normally when it arrives.
        return;
      }
      if (!isCurrent()) return;

      for (
        let index = 0;
        index < texts.length &&
        fetched < PREFETCH_MAX_PARAGRAPHS &&
        buffered < PREFETCH_TARGET_SECONDS;
        index++, fetched++
      ) {
        buffered += estimateSpeechSeconds(texts[index], rateRef.current);
        const url = await getCache().prefetch(
          texts[index],
          settings,
          currentBookId
        );
        if (!isCurrent()) return;
        // Only take the idle audio element when nothing else is queued in this
        // section; otherwise it holds the next current-section URL.
        if (url && startIndex === queue.length - 1 && index === 0) {
          getAudio().preload(url);
        }
      }
    },
    [currentBookId, getAudio, getCache, loadSectionTexts]
  );

  /**
   * Starts the read-ahead fill after the current paragraph has actually been
   * playing for a moment, so a burst of skip clicks does not issue a request
   * per click.
   */
  const scheduleReadAhead = useCallback(
    (index: number) => {
      cancelReadAhead();
      const token = tokenRef.current;
      const run = readAheadRunRef.current;
      prefetchTimerRef.current = window.setTimeout(() => {
        prefetchTimerRef.current = null;
        if (token !== tokenRef.current || statusRef.current !== "playing") {
          return;
        }
        void fillReadAhead(index, token, run);
      }, PREFETCH_DELAY_MS);
    },
    [cancelReadAhead, fillReadAhead]
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
        url = await getCache().get(paragraph.text, settings, currentBookId);
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
        scheduleReadAhead(index);
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
      scheduleReadAhead,
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
      cancelReadAhead();
      cacheRef.current?.dispose();
      audioRef.current?.dispose();
    };
  }, [cancelReadAhead]);

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

      const queueForDoc = (doc: Document): number => {
        const queue = buildQueue(doc);
        let startIndex = 0;
        const resolved = href ? state.book?.resolveHref?.(href) : null;
        const anchor = resolved?.anchor?.(doc);
        if (anchor instanceof Element) {
          startIndex = findParagraphIndex(queue, paragraphRange(doc, anchor));
        }
        return startIndex;
      };

      const doc = docRef.current;
      if (doc && sectionIndexRef.current === sectionIndex) {
        void playIndex(queueForDoc(doc));
        return;
      }

      // The section may already be rendered without a fresh `load` event
      // (for example when the reader turns back to the section they are in).
      const renderedDoc = view.renderer
        ?.getContents?.()
        .find((content) => content.index === sectionIndex)?.doc;
      if (renderedDoc) {
        docRef.current = renderedDoc;
        sectionIndexRef.current = sectionIndex;
        void playIndex(queueForDoc(renderedDoc));
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
      const rendered = viewRef.current?.renderer
        ?.getContents?.()
        .find((content) => content.doc === doc);
      if (rendered) sectionIndexRef.current = rendered.index;
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
    [buildQueue, findParagraphIndex, getAudio, playIndex, viewRef]
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

  const setPlaybackRate = useCallback(
    (rate: number) => {
      updateSettings({ playbackRate: rate });
      rateRef.current = rate;
      audioRef.current?.setRate(rate);
    },
    [updateSettings]
  );

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") return;
    cancelReadAhead();
    audioRef.current?.pause();
    updateStatus("paused");
  }, [cancelReadAhead, updateStatus]);

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
          scheduleReadAhead(indexRef.current);
        })
        .catch(() => fail("Could not resume the audio. Try again."));
      return;
    }

    if (statusRef.current === "error") {
      void playIndex(indexRef.current);
    }
  }, [fail, getAudio, pause, playIndex, scheduleReadAhead, updateStatus]);

  const prev = useCallback(() => {
    cancelReadAhead();
    if (indexRef.current > 0) void playIndex(indexRef.current - 1);
  }, [cancelReadAhead, playIndex]);

  const next = useCallback(() => {
    cancelReadAhead();
    const target = indexRef.current + 1;
    if (target < queueRef.current.length) void playIndex(target);
    else finishQueue();
  }, [cancelReadAhead, finishQueue, playIndex]);

  const retry = useCallback(() => {
    void playIndex(indexRef.current);
  }, [playIndex]);

  const stop = useCallback(() => {
    tokenRef.current++;
    pendingRef.current = null;
    cancelReadAhead();
    getCache().abortAll();
    getAudio().stop();
    queueRef.current = [];
    indexRef.current = -1;
    setParagraphIndex(0);
    setParagraphCount(0);
    setCurrentRange(null);
    setError(null);
    updateStatus("idle");
  }, [cancelReadAhead, getAudio, getCache, updateStatus]);

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
    paragraphIndex,
    paragraphCount,
    playbackRate,
    setPlaybackRate,
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

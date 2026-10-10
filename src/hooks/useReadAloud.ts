import { useCallback, useEffect, useRef, useState } from "react";
import type { Book, FoliateView, TOCItem } from "../types";
import { useStore } from "../store/useStore";
import { useChapterScopeDepth } from "./useChapterScopeDepth";
import { useSpeechSettings } from "./useSpeechSettings";
import {
  generateSpeech,
  type SpeechRequestSettings,
} from "../services/speechService";
import { LLMServiceError, formatLLMError } from "../services/llmClient";
import {
  extractParagraphs,
  paragraphRange,
  type ReadAloudParagraph,
} from "../utils/ttsChunker";
import {
  flattenTocWithDepth,
  resolveScopeEntry,
  type FlatTocEntry,
} from "../utils/tocUtils";

export type ReadAloudStatus =
  "idle" | "loading" | "playing" | "paused" | "chapterEnd" | "error";

export interface ReadAloudPlayer {
  status: ReadAloudStatus;
  error: string | null;
  /** 0-based index of the paragraph being read, within the current section. */
  paragraphIndex: number;
  paragraphCount: number;
  /** Range of the paragraph being read, for highlighting and auto-follow. */
  currentRange: Range | null;
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

interface ChapterScope {
  start: number;
  end: number;
}

/** A tiny silent WAV, used to unlock the audio element inside the click. */
const SILENT_AUDIO =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

const CACHE_LIMIT = 200;

const HIGHLIGHT_STYLE_ID = "read-aloud-highlight-style";

/** Minimal shape of the Custom Highlight API on the section window. */
interface HighlightCapableWindow {
  CSS?: {
    highlights?: {
      set: (name: string, highlight: unknown) => void;
      delete: (name: string) => void;
    };
  };
  Highlight?: new (...ranges: Range[]) => unknown;
}

/** Injects the `::highlight(read-aloud)` rule once per section document. */
function injectHighlightStyle(doc: Document): void {
  if (doc.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent =
    "::highlight(read-aloud) { background-color: rgba(46, 125, 50, 0.28); }";
  (doc.head ?? doc.documentElement).appendChild(style);
}

function isDescendantOf(
  entry: FlatTocEntry,
  ancestor: FlatTocEntry,
  entries: FlatTocEntry[]
): boolean {
  let parentHref = entry.parentHref;
  while (parentHref) {
    if (parentHref === ancestor.href) return true;
    parentHref =
      entries.find((item) => item.href === parentHref)?.parentHref ?? null;
  }
  return false;
}

/**
 * Chapter scope for a starting point, following the book's "A chapter is"
 * depth the same way previews do. Returns the inclusive section range.
 */
function computeChapterScope(
  book: Book | null,
  toc: TOCItem[] | undefined,
  href: string | null,
  depth: number | null
): ChapterScope | null {
  if (!book?.sections?.length) return null;
  const lastSection = book.sections.length - 1;
  if (!href || !toc?.length) return { start: 0, end: lastSection };

  const scope = resolveScopeEntry(href, toc, depth ?? 0);
  if (!scope) return { start: 0, end: lastSection };

  const startResolved = book.resolveHref?.(scope.href);
  if (!startResolved) return { start: 0, end: lastSection };

  const start = startResolved.index;
  let end = lastSection;
  const entries = flattenTocWithDepth(toc);
  const scopeIndex = entries.findIndex((entry) => entry.href === scope.href);

  for (let i = scopeIndex + 1; i < entries.length; i++) {
    const entry = entries[i];
    if (isDescendantOf(entry, scope, entries)) continue;
    const resolved = book.resolveHref?.(entry.href);
    if (resolved && resolved.index > start) {
      end = resolved.index - 1;
      break;
    }
  }

  return { start, end };
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
  const pendingRef = useRef<"start" | "continue" | null>(null);
  const pendingHrefRef = useRef<string | null>(null);
  const tokenRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const inFlightRef = useRef<Map<string, Promise<string>>>(new Map());
  const abortRef = useRef<Set<AbortController>>(new Set());
  const paragraphsCacheRef = useRef<WeakMap<Document, ReadAloudParagraph[]>>(
    new WeakMap()
  );
  const advanceRef = useRef<() => void>(() => {});
  const followRef = useRef<((range: Range) => void) | null>(null);

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

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const unlockAudio = useCallback(() => {
    const audio = getAudio();
    if (audio.dataset.unlocked === "1") return;
    audio.dataset.unlocked = "1";
    audio.muted = true;
    audio.src = SILENT_AUDIO;
    const unlockSrc = audio.src;
    void audio
      .play()
      .then(() => {
        // Only reset if the real paragraph has not already replaced it.
        if (audio.src === unlockSrc) {
          audio.pause();
          audio.currentTime = 0;
        }
        audio.muted = false;
      })
      .catch(() => {
        delete audio.dataset.unlocked;
        audio.muted = false;
      });
  }, [getAudio]);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }, []);

  const abortAll = useCallback(() => {
    for (const controller of abortRef.current) controller.abort();
    abortRef.current.clear();
    inFlightRef.current.clear();
  }, []);

  const trimCache = useCallback(() => {
    const cache = cacheRef.current;
    if (cache.size <= CACHE_LIMIT) return;
    const excess = cache.size - CACHE_LIMIT;
    let removed = 0;
    for (const [key, url] of cache) {
      if (removed >= excess) break;
      URL.revokeObjectURL(url);
      cache.delete(key);
      removed++;
    }
  }, []);

  const cacheKeyFor = useCallback(
    (text: string, settings: NonNullable<typeof speechSettings>): string =>
      `${settings.baseUrl}|${settings.model}|${settings.voice}|${text}`,
    []
  );

  const requestParagraphUrl = useCallback(
    (
      paragraph: ReadAloudParagraph,
      settings: SpeechRequestSettings
    ): Promise<string> => {
      const key = cacheKeyFor(paragraph.text, settings);
      const cached = cacheRef.current.get(key);
      if (cached) return Promise.resolve(cached);

      // A prefetch may already be fetching the same paragraph; share it.
      const existing = inFlightRef.current.get(key);
      if (existing) return existing;

      const controller = new AbortController();
      abortRef.current.add(controller);
      const promise = generateSpeech(
        paragraph.text,
        settings,
        controller.signal
      )
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          cacheRef.current.set(key, url);
          trimCache();
          return url;
        })
        .finally(() => {
          abortRef.current.delete(controller);
          inFlightRef.current.delete(key);
        });
      inFlightRef.current.set(key, promise);
      return promise;
    },
    [cacheKeyFor, trimCache]
  );

  const prefetchIndex = useCallback(
    (index: number) => {
      const paragraph = queueRef.current[index];
      const settings = stateRef.current.speechSettings;
      if (!paragraph || !settings) return;
      const key = cacheKeyFor(paragraph.text, settings);
      if (cacheRef.current.has(key) || inFlightRef.current.has(key)) return;
      void requestParagraphUrl(paragraph, settings).catch(() => {
        // Prefetch failures are silent; playback retries on demand.
      });
    },
    [cacheKeyFor, requestParagraphUrl]
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
      pendingRef.current = "continue";
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

      void prefetchIndex(index + 1);

      let url: string;
      try {
        url = await requestParagraphUrl(paragraph, settings);
      } catch (err) {
        if (token !== tokenRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        fail(
          err instanceof LLMServiceError ? err.message : formatLLMError(err)
        );
        return;
      }
      if (!url || token !== tokenRef.current) return;

      const audio = getAudio();
      audio.src = url;
      audio.currentTime = 0;

      try {
        await audio.play();
        if (token !== tokenRef.current) return;
        updateStatus("playing");
        followRef.current?.(paragraph.range);
      } catch (err) {
        if (token !== tokenRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        fail("Could not play the audio. Try again.");
      }
    },
    [
      fail,
      finishQueue,
      getAudio,
      prefetchIndex,
      requestParagraphUrl,
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

      if (pendingRef.current === "continue") {
        pendingRef.current = null;
        buildQueue(doc);
        void playIndex(0);
        return;
      }

      if (pendingRef.current === "start") {
        pendingRef.current = null;
        const queue = buildQueue(doc);
        const href = pendingHrefRef.current;
        pendingHrefRef.current = null;

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

  useEffect(() => {
    const audio = getAudio();
    const onEnded = () => advanceRef.current();
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
    };
  }, [getAudio]);

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

  // Highlight the whole paragraph being read, where the browser supports it.
  useEffect(() => {
    if (!currentRange) return;
    const doc = currentRange.startContainer.ownerDocument;
    if (!doc) return;
    injectHighlightStyle(doc);

    const win = doc.defaultView as HighlightCapableWindow | null;
    const registry = win?.CSS?.highlights;
    const HighlightCtor = win?.Highlight;
    if (!registry || !HighlightCtor) return;

    registry.set("read-aloud", new HighlightCtor(currentRange));
    return () => {
      registry.delete("read-aloud");
    };
  }, [currentRange]);

  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      abortAll();
      for (const url of cache.values()) URL.revokeObjectURL(url);
      cache.clear();
    };
  }, [abortAll]);

  const beginAtSection = useCallback(
    (sectionIndex: number, href: string | null) => {
      const view = viewRef.current;
      const state = stateRef.current;
      if (!view) return;

      unlockAudio();
      stopAudio();
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

      pendingRef.current = "start";
      pendingHrefRef.current = href;
      updateStatus("loading");
      void view.goTo(sectionIndex);
    },
    [
      buildQueue,
      findParagraphIndex,
      playIndex,
      stopAudio,
      unlockAudio,
      updateStatus,
      viewRef,
    ]
  );

  const startFrom = useCallback(
    (range: Range) => {
      const doc = range.startContainer.ownerDocument;
      if (!doc) return;

      const state = stateRef.current;
      unlockAudio();
      stopAudio();
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
    [buildQueue, findParagraphIndex, playIndex, stopAudio, unlockAudio]
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
    audioRef.current?.pause();
    updateStatus("paused");
  }, [updateStatus]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (statusRef.current === "playing") {
      audio.pause();
      updateStatus("paused");
      return;
    }

    if (statusRef.current === "paused") {
      unlockAudio();
      audio
        .play()
        .then(() => updateStatus("playing"))
        .catch(() => fail("Could not resume the audio. Try again."));
      return;
    }

    if (statusRef.current === "error") {
      void playIndex(indexRef.current);
    }
  }, [fail, playIndex, unlockAudio, updateStatus]);

  const prev = useCallback(() => {
    if (indexRef.current > 0) void playIndex(indexRef.current - 1);
  }, [playIndex]);

  const next = useCallback(() => {
    const target = indexRef.current + 1;
    if (target < queueRef.current.length) void playIndex(target);
    else finishQueue();
  }, [finishQueue, playIndex]);

  const retry = useCallback(() => {
    void playIndex(indexRef.current);
  }, [playIndex]);

  const stop = useCallback(() => {
    tokenRef.current++;
    pendingRef.current = null;
    pendingHrefRef.current = null;
    abortAll();
    stopAudio();
    queueRef.current = [];
    indexRef.current = -1;
    setParagraphIndex(0);
    setParagraphCount(0);
    setCurrentRange(null);
    setError(null);
    updateStatus("idle");
  }, [abortAll, stopAudio, updateStatus]);

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
    paragraphIndex,
    paragraphCount,
    currentRange,
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

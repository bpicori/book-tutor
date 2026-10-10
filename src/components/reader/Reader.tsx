import { useEffect, useRef, useCallback, useState } from "react";
import type { FoliateView, Highlight, HighlightColor } from "../../types";
import { useStore } from "../../store/useStore";
import { applyBookStyles } from "../../utils/bookOpeners";
import { getHighlightHex } from "../../constants";
import { SelectionActionBar } from "../selection-action-bar";
import { HighlightPopup } from "../selection-action-bar/HighlightPopup";
import { useSelectionHandler } from "../../hooks/useSelectionHandler";
import { useAskQuestion } from "../../hooks/useAskQuestion";
import type { ReadAloudPlayer } from "../../hooks/useReadAloud";
import { getParagraphBlocks, paragraphRange } from "../../utils/ttsChunker";
import { ParagraphPlayButton } from "./ParagraphPlayButton";
// @ts-expect-error - foliate-js module has no type declarations
import { Overlayer } from "../../foliate-js/overlayer.js";
import "../../foliate-js/view.js";

interface ReaderProps {
  viewRef: React.MutableRefObject<FoliateView | null>;
  player: ReadAloudPlayer;
}

interface ActiveHighlightPopup {
  highlight: Highlight;
  left: number;
  top: number;
  position: "above" | "below";
}

export function Reader({ viewRef, player }: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewReady, setViewReady] = useState(false);
  const [activeHighlightPopup, setActiveHighlightPopup] =
    useState<ActiveHighlightPopup | null>(null);
  const [hoverButton, setHoverButton] = useState<{
    left: number;
    top: number;
    range: Range;
  } | null>(null);
  const hoverBlockRef = useRef<Element | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimerRef.current = window.setTimeout(() => {
      setHoverButton(null);
      hoverBlockRef.current = null;
      hideTimerRef.current = null;
    }, 180);
  }, [cancelHide]);

  const { setProgress, setCurrentTocHref, setCurrentSectionIndex, settings } =
    useStore();

  const { selection, dismissSelection, createHighlight } = useSelectionHandler({
    containerRef: containerRef as React.RefObject<HTMLElement | null>,
    viewRef,
    viewReady,
  });

  const askQuestion = useAskQuestion();

  const pauseReadAloud = player.pause;
  const startReadAloud = player.startFrom;

  // A text selection pauses playback so the two highlights never fight.
  useEffect(() => {
    if (!selection) return;
    pauseReadAloud();
    setHoverButton(null);
    hoverBlockRef.current = null;
  }, [selection, pauseReadAloud]);

  const handleAskAI = useCallback(
    (text: string) => {
      askQuestion(text);
    },
    [askQuestion]
  );

  const handleHighlight = useCallback(
    async (color: HighlightColor) => {
      await createHighlight(color);
    },
    [createHighlight]
  );

  const handleSelectionAskAI = useCallback(() => {
    if (!selection?.text) return;
    const prompt = `Can you explain this passage from the book?\n\n"${selection.text}"`;
    handleAskAI(prompt);
    dismissSelection();
  }, [selection, handleAskAI, dismissSelection]);

  const handleRelocate = useCallback(
    (event: Event) => {
      const { fraction, tocItem, section, location, cfi } = (
        event as CustomEvent
      ).detail;
      setProgress({
        fraction,
        tocLabel: tocItem?.label,
        location: location
          ? { current: location.current, total: location.total }
          : undefined,
        cfi: cfi || undefined,
      });
      if (tocItem?.href) setCurrentTocHref(tocItem.href);
      if (typeof section?.current === "number")
        setCurrentSectionIndex(section.current);
    },
    [setProgress, setCurrentTocHref, setCurrentSectionIndex]
  );

  useEffect(() => {
    const view = viewRef.current;
    if (!view?.book || !view.renderer) return;

    applyBookStyles(view.renderer, settings);
  }, [settings, viewRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const view = document.createElement("foliate-view") as FoliateView;
    view.style.width = "100%";
    view.style.height = "100%";

    const handleDrawAnnotation = (event: Event) => {
      const { draw, annotation } = (event as CustomEvent).detail as {
        draw: (
          func: typeof Overlayer.highlight,
          opts: { color: string }
        ) => void;
        annotation: { color?: string };
      };
      const color = annotation.color ?? "#FDE047";
      draw(Overlayer.highlight, { color });
    };

    const handleCreateOverlay = (event: Event) => {
      const { index } = (event as CustomEvent).detail as { index: number };
      const { currentBookId, highlights: bookHighlights } = useStore.getState();
      if (!currentBookId) return;

      const sectionHighlights = bookHighlights.filter(
        (h) => h.bookId === currentBookId && h.sectionIndex === index
      );

      for (const h of sectionHighlights) {
        void view.addAnnotation({
          value: h.cfi,
          color: getHighlightHex(h.color),
        });
      }
    };

    const handleShowAnnotation = (event: Event) => {
      const { value, range } = (event as CustomEvent).detail as {
        value: string;
        range?: Range;
      };
      const highlight = useStore
        .getState()
        .highlights.find((h) => h.cfi === value);
      if (!highlight) return;

      const padding = 8;
      const popupWidth = 280;
      const popupHeight = 200;

      let left = window.innerWidth / 2;
      let top = window.innerHeight / 2;
      let position: "above" | "below" = "above";

      if (range) {
        const rects = range.getClientRects();
        if (rects.length > 0) {
          const firstRect = rects[0];
          left = firstRect.left + firstRect.width / 2;
          top = firstRect.top;
          position = firstRect.top >= popupHeight + padding ? "above" : "below";
          if (position === "below") {
            top = firstRect.bottom + padding;
          }
        }
      }

      left = Math.max(
        padding,
        Math.min(
          left - popupWidth / 2,
          window.innerWidth - popupWidth - padding
        )
      );

      setActiveHighlightPopup({ highlight, left, top, position });
    };

    view.addEventListener("draw-annotation", handleDrawAnnotation);
    view.addEventListener("create-overlay", handleCreateOverlay);
    view.addEventListener("show-annotation", handleShowAnnotation);
    view.addEventListener("relocate", handleRelocate);

    container.appendChild(view);
    viewRef.current = view;
    setViewReady(true);

    return () => {
      view.removeEventListener("draw-annotation", handleDrawAnnotation);
      view.removeEventListener("create-overlay", handleCreateOverlay);
      view.removeEventListener("show-annotation", handleShowAnnotation);
      view.removeEventListener("relocate", handleRelocate);
      view.remove();
      viewRef.current = null;
      setViewReady(false);
    };
  }, [handleRelocate, viewRef]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !viewReady) return;

    const cleanups = new Map<Document, () => void>();

    const attach = (doc: Document) => {
      if (cleanups.has(doc)) return;
      const blocks = getParagraphBlocks(doc);

      const handleOver = (event: Event) => {
        const target = event.target as Element | null;
        const block = target
          ? blocks.find(
              (candidate) => candidate === target || candidate.contains(target)
            )
          : undefined;

        if (!block) {
          if (hoverBlockRef.current) scheduleHide();
          return;
        }
        if (hoverBlockRef.current === block) return;

        cancelHide();
        hoverBlockRef.current = block;

        const rect = block.getBoundingClientRect();
        const frame = doc.defaultView?.frameElement as HTMLElement | null;
        const frameRect = frame?.getBoundingClientRect();
        if (!frameRect) return;

        const size = 32;
        let left = frameRect.left + rect.left - size;
        if (left < 4) left = frameRect.left + rect.left + 2;
        left = Math.max(4, Math.min(left, window.innerWidth - size - 4));
        const top = Math.max(
          4,
          Math.min(frameRect.top + rect.top + 2, window.innerHeight - size - 4)
        );

        setHoverButton({ left, top, range: paragraphRange(doc, block) });
      };

      const handleLeave = () => scheduleHide();

      doc.addEventListener("mouseover", handleOver);
      doc.addEventListener("mouseleave", handleLeave);
      cleanups.set(doc, () => {
        doc.removeEventListener("mouseover", handleOver);
        doc.removeEventListener("mouseleave", handleLeave);
      });
    };

    const handleLoad = (event: Event) => {
      const { doc } = (event as CustomEvent).detail as { doc?: Document };
      if (doc) attach(doc);
    };

    view.addEventListener("load", handleLoad);
    view.renderer?.getContents?.().forEach(({ doc }) => attach(doc));

    return () => {
      view.removeEventListener("load", handleLoad);
      for (const cleanup of cleanups.values()) cleanup();
      cleanups.clear();
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [viewRef, viewReady, cancelHide, scheduleHide]);

  const handleHoverPlay = useCallback(() => {
    if (!hoverButton) return;
    startReadAloud(hoverButton.range);
    setHoverButton(null);
    hoverBlockRef.current = null;
    cancelHide();
  }, [hoverButton, startReadAloud, cancelHide]);

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-sepia-panel"
      />
      {hoverButton && player.status !== "error" && !selection && (
        <ParagraphPlayButton
          left={hoverButton.left}
          top={hoverButton.top}
          onPlay={handleHoverPlay}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        />
      )}
      <div data-selection-bar>
        <SelectionActionBar
          selection={selection}
          onDismiss={dismissSelection}
          onHighlight={handleHighlight}
          onAskAI={handleSelectionAskAI}
        />
        {activeHighlightPopup && (
          <HighlightPopup
            highlight={activeHighlightPopup.highlight}
            viewRef={viewRef}
            left={activeHighlightPopup.left}
            top={activeHighlightPopup.top}
            width={280}
            position={activeHighlightPopup.position}
            onClose={() => setActiveHighlightPopup(null)}
            onAskAI={handleAskAI}
          />
        )}
      </div>
    </>
  );
}

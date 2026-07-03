import { useEffect, useRef, useCallback, useState } from "react";
import type { FoliateView, Highlight, HighlightColor } from "../../types";
import { useStore } from "../../store/useStore";
import { applyBookStyles } from "../../utils/bookOpeners";
import { getHighlightHex } from "../../constants";
import { SelectionActionBar } from "../selection-action-bar";
import { HighlightPopup } from "../selection-action-bar/HighlightPopup";
import { useSelectionHandler } from "../../hooks/useSelectionHandler";
// @ts-expect-error - foliate-js module has no type declarations
import { Overlayer } from "../../foliate-js/overlayer.js";
import "../../foliate-js/view.js";

interface ReaderProps {
  viewRef: React.MutableRefObject<FoliateView | null>;
}

interface ActiveHighlightPopup {
  highlight: Highlight;
  left: number;
  top: number;
  position: "above" | "below";
}

export function Reader({ viewRef }: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewReady, setViewReady] = useState(false);
  const [activeHighlightPopup, setActiveHighlightPopup] =
    useState<ActiveHighlightPopup | null>(null);

  const {
    setProgress,
    setCurrentTocHref,
    setCurrentSectionIndex,
    settings,
    setAiSidebarOpen,
    setActiveAiTab,
    setPendingQuote,
  } = useStore();

  const { selection, dismissSelection, createHighlight } = useSelectionHandler({
    containerRef: containerRef as React.RefObject<HTMLElement | null>,
    viewRef,
    viewReady,
  });

  const handleAskAI = useCallback(
    (text: string) => {
      setAiSidebarOpen(true);
      setActiveAiTab("ask");
      setPendingQuote(text);
    },
    [setAiSidebarOpen, setActiveAiTab, setPendingQuote]
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

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-sepia-panel"
      />
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

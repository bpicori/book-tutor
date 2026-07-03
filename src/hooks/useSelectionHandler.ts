import { useState, useEffect, useCallback, useRef } from "react";
import type { FoliateView, HighlightColor, SelectionInfo } from "../types";
import { getHighlightHex } from "../constants";
import { useStore } from "../store/useStore";

interface UseSelectionHandlerOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  viewRef: React.MutableRefObject<FoliateView | null>;
  viewReady?: boolean;
}

/**
 * Hook to handle text selection in the reader view.
 * Manages selection state, event listeners, positioning logic, and highlight creation.
 */
export function useSelectionHandler({
  containerRef,
  viewRef,
  viewReady = false,
}: UseSelectionHandlerOptions) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const documentListenersRef = useRef<
    Array<{ doc: Document; cleanup: () => void }>
  >([]);
  const selectionRangeRef = useRef<Range | null>(null);
  const selectionSectionIndexRef = useRef<number | null>(null);
  const docToSectionIndexRef = useRef<Map<Document, number>>(new Map());

  const { currentBookId, progress, currentTocHref, addHighlight } = useStore();

  const handleSelection = useCallback(
    (doc: Document, clientX?: number, clientY?: number) => {
      setTimeout(() => {
        const sel = doc.getSelection();

        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          return;
        }

        const text = sel.toString().trim();
        if (!text) return;

        const range = sel.getRangeAt(0).cloneRange();
        selectionRangeRef.current = range;
        selectionSectionIndexRef.current =
          docToSectionIndexRef.current.get(doc) ?? null;

        const rects = range.getClientRects();
        const iframe = doc.defaultView?.frameElement as HTMLElement | null;
        const iframeRect = iframe?.getBoundingClientRect();

        let x: number;
        let y: number;
        let height: number = 20;

        if (rects.length > 0 && iframeRect) {
          const firstRect = rects[0];
          x = iframeRect.left + firstRect.left + firstRect.width / 2;
          y = iframeRect.top + firstRect.top + 8;
          height = firstRect.height;
        } else if (
          iframeRect &&
          clientX !== undefined &&
          clientY !== undefined
        ) {
          x = iframeRect.left + clientX;
          y = iframeRect.top + clientY - 50;
        } else {
          const container = containerRef.current;
          if (!container) return;
          const containerRect = container.getBoundingClientRect();
          if (clientX !== undefined && clientY !== undefined) {
            x = containerRect.left + clientX;
            y = containerRect.top + clientY - 50;
          } else {
            x = containerRect.left + containerRect.width / 2;
            y = containerRect.top + containerRect.height / 2;
          }
        }

        setSelection({ text, x, y, height });
      }, 20);
    },
    [containerRef]
  );

  const setupDocumentListeners = useCallback(
    (doc: Document) => {
      const handleMouseUp = (e: MouseEvent) => {
        handleSelection(doc, e.clientX, e.clientY);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        if (touch) {
          handleSelection(doc, touch.clientX, touch.clientY);
        }
      };

      const handleMouseDown = () => {
        setTimeout(() => {
          const sel = doc.getSelection();
          if (!sel || sel.isCollapsed || !sel.toString().trim()) {
            setSelection(null);
            selectionRangeRef.current = null;
          }
        }, 10);
      };

      const handleTouchStart = () => {
        setTimeout(() => {
          const sel = doc.getSelection();
          if (!sel || sel.isCollapsed || !sel.toString().trim()) {
            setSelection(null);
            selectionRangeRef.current = null;
          }
        }, 10);
      };

      doc.addEventListener("mouseup", handleMouseUp);
      doc.addEventListener("mousedown", handleMouseDown);
      doc.addEventListener("touchend", handleTouchEnd, { passive: false });
      doc.addEventListener("touchstart", handleTouchStart);

      const cleanup = () => {
        doc.removeEventListener("mouseup", handleMouseUp);
        doc.removeEventListener("mousedown", handleMouseDown);
        doc.removeEventListener("touchend", handleTouchEnd);
        doc.removeEventListener("touchstart", handleTouchStart);
      };

      documentListenersRef.current.push({ doc, cleanup });
    },
    [handleSelection]
  );

  const dismissSelection = useCallback(() => {
    setSelection(null);
    selectionRangeRef.current = null;
  }, []);

  const createHighlight = useCallback(
    async (color: HighlightColor) => {
      const view = viewRef.current;
      const range = selectionRangeRef.current;
      const sectionIndex = selectionSectionIndexRef.current;

      if (!view || !range || sectionIndex === null || !currentBookId) {
        return null;
      }

      const cfi = view.getCFI(sectionIndex, range);
      const hex = getHighlightHex(color);
      const text = selection?.text ?? range.toString().trim();

      const highlight = {
        id: crypto.randomUUID(),
        bookId: currentBookId,
        cfi,
        sectionIndex,
        text,
        color,
        chapterHref: currentTocHref ?? undefined,
        chapterLabel: progress.tocLabel,
        createdAt: Date.now(),
      };

      addHighlight(highlight);
      await view.addAnnotation({ value: cfi, color: hex });

      dismissSelection();
      return highlight;
    },
    [
      viewRef,
      currentBookId,
      selection,
      currentTocHref,
      progress.tocLabel,
      addHighlight,
      dismissSelection,
    ]
  );

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const handleLoad = (event: Event) => {
      const { doc, index } = (event as CustomEvent).detail as {
        doc?: Document;
        index?: number;
      };
      if (doc && typeof index === "number") {
        docToSectionIndexRef.current.set(doc, index);
        setupDocumentListeners(doc);
      }
    };

    view.addEventListener("load", handleLoad);

    return () => {
      view.removeEventListener("load", handleLoad);
    };
  }, [viewRef, setupDocumentListeners, viewReady]);

  useEffect(() => {
    const docToSectionIndex = docToSectionIndexRef.current;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const selectionBar = document.querySelector("[data-selection-bar]");
      if (selectionBar?.contains(target)) {
        return;
      }

      setSelection(null);
      selectionRangeRef.current = null;
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      const listeners = documentListenersRef.current;
      for (const { cleanup } of listeners) {
        cleanup();
      }
      documentListenersRef.current = [];
      docToSectionIndex.clear();
    };
  }, []);

  return { selection, dismissSelection, createHighlight };
}

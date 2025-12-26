import { useState, useEffect, useCallback, useRef } from "react";
import type { SelectionInfo } from "../types";

interface UseSelectionHandlerOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  viewRef: React.MutableRefObject<HTMLElement | null>;
  viewReady?: boolean;
}

/**
 * Hook to handle text selection in the reader view.
 * Manages selection state, event listeners, and positioning logic.
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

  const handleSelection = useCallback(
    (doc: Document, clientX?: number, clientY?: number) => {
      setTimeout(() => {
        const sel = doc.getSelection();

        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          return;
        }

        const text = sel.toString().trim();
        if (!text) return;

        // Get selection range
        const range = sel.getRangeAt(0);
        const rects = range.getClientRects();

        // Find the iframe element to get its position in the main viewport
        const iframe = doc.defaultView?.frameElement as HTMLElement | null;
        const iframeRect = iframe?.getBoundingClientRect();

        let x: number;
        let y: number;
        let height: number = 20; // Default fallback height

        if (rects.length > 0 && iframeRect) {
          // Use the first rect of the selection for positioning
          const firstRect = rects[0];
          // Add iframe's position to get main viewport coordinates
          x = iframeRect.left + firstRect.left + firstRect.width / 2;
          // Position closer to the selection (add small offset to reduce gap)
          y = iframeRect.top + firstRect.top + 8;
          height = firstRect.height;
        } else if (
          iframeRect &&
          clientX !== undefined &&
          clientY !== undefined
        ) {
          // Fallback to touch/mouse position within iframe + iframe offset
          x = iframeRect.left + clientX;
          y = iframeRect.top + clientY - 50;
        } else {
          // Last resort: use container position
          const container = containerRef.current;
          if (!container) return;
          const containerRect = container.getBoundingClientRect();
          if (clientX !== undefined && clientY !== undefined) {
            x = containerRect.left + clientX;
            y = containerRect.top + clientY - 50;
          } else {
            // Center position as fallback
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
        // Prevent default to avoid triggering mouse events
        e.preventDefault();
        const touch = e.changedTouches[0];
        if (touch) {
          handleSelection(doc, touch.clientX, touch.clientY);
        }
      };

      // Dismiss selection bar when clicking/touching inside the document (without selecting)
      const handleMouseDown = () => {
        setTimeout(() => {
          const sel = doc.getSelection();
          if (!sel || sel.isCollapsed || !sel.toString().trim()) {
            setSelection(null);
          }
        }, 10);
      };

      const handleTouchStart = () => {
        setTimeout(() => {
          const sel = doc.getSelection();
          if (!sel || sel.isCollapsed || !sel.toString().trim()) {
            setSelection(null);
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
  }, []);

  // Setup listeners when new documents load
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const handleLoad = (event: Event) => {
      const { doc } = (event as CustomEvent).detail;
      if (doc) {
        setupDocumentListeners(doc);
      }
    };

    view.addEventListener("load", handleLoad);

    return () => {
      view.removeEventListener("load", handleLoad);
    };
  }, [viewRef, setupDocumentListeners, viewReady]);

  // Handle clicks/touches outside to dismiss selection bar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const selectionBar = document.querySelector("[data-selection-bar]");
      if (selectionBar?.contains(target)) {
        return;
      }

      setSelection(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      // Cleanup all document listeners
      for (const { cleanup } of documentListenersRef.current) {
        cleanup();
      }
      documentListenersRef.current = [];
    };
  }, []);

  return { selection, dismissSelection };
}

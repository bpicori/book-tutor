import { useEffect, useRef, useCallback, useState } from "react";
import type { FoliateView } from "../../types";
import { useStore } from "../../store/useStore";
import { generateReaderCSS } from "../../utils/readerStyles";
import { SelectionActionBar } from "../selection-action-bar";
import type { SelectionInfo } from "../../types";
import "../../foliate-js/view.js";

interface ReaderProps {
  viewRef: React.MutableRefObject<FoliateView | null>;
}

export function Reader({ viewRef }: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setProgress, setCurrentTocHref, setCurrentSectionIndex, settings } =
    useStore();
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

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
      // Section index is in section.current from the progress object
      if (typeof section?.current === "number")
        setCurrentSectionIndex(section.current);
    },
    [setProgress, setCurrentTocHref, setCurrentSectionIndex]
  );

  const handleDismissSelection = useCallback(() => {
    setSelection(null);
  }, []);

  // Apply reader styles (typography and theme) when settings change
  useEffect(() => {
    const view = viewRef.current;
    if (!view?.book || !view.renderer) return;

    const css = generateReaderCSS(settings);
    view.renderer.setStyles?.(css);
  }, [settings, viewRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const view = document.createElement("foliate-view") as FoliateView;
    view.style.width = "100%";
    view.style.height = "100%";

    container.appendChild(view);
    viewRef.current = view;
    view.addEventListener("relocate", handleRelocate);

    const documentListeners: Array<{ doc: Document; cleanup: () => void }> = [];

    const setupDocumentListeners = (doc: Document) => {
      const handleSelection = (clientX?: number, clientY?: number) => {
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
      };

      const handleMouseUp = (e: MouseEvent) => {
        handleSelection(e.clientX, e.clientY);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        // Prevent default to avoid triggering mouse events
        e.preventDefault();
        const touch = e.changedTouches[0];
        if (touch) {
          handleSelection(touch.clientX, touch.clientY);
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

      documentListeners.push({ doc, cleanup });
    };

    // Handle when new documents load
    const handleLoad = (event: Event) => {
      const { doc } = (event as CustomEvent).detail;
      if (doc) {
        setupDocumentListeners(doc);
      }
    };

    view.addEventListener("load", handleLoad);

    // Handle clicks/touches outside to dismiss selection bar (for clicks outside iframe)
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
      view.removeEventListener("relocate", handleRelocate);
      view.removeEventListener("load", handleLoad);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      for (const { cleanup } of documentListeners) {
        cleanup();
      }
      view.remove();
      viewRef.current = null;
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
          onDismiss={handleDismissSelection}
        />
      </div>
    </>
  );
}

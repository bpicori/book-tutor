import { useEffect, useRef, useCallback } from "react";
import type { FoliateView } from "../../types";
import { useStore } from "../../store/useStore";
import { generateReaderCSS } from "../../utils/readerStyles";
import { SelectionActionBar } from "../selection-action-bar";
import { useSelectionHandler } from "../../hooks/useSelectionHandler";
import "../../foliate-js/view.js";

interface ReaderProps {
  viewRef: React.MutableRefObject<FoliateView | null>;
}

export function Reader({ viewRef }: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setProgress, setCurrentTocHref, setCurrentSectionIndex, settings } =
    useStore();
  const { selection, dismissSelection } = useSelectionHandler({
    containerRef: containerRef as React.RefObject<HTMLElement | null>,
    viewRef,
  });

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

    return () => {
      view.removeEventListener("relocate", handleRelocate);
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
          onDismiss={dismissSelection}
        />
      </div>
    </>
  );
}

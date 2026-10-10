import { useEffect } from "react";

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

/**
 * Highlights the paragraph being read, where the browser supports the CSS
 * Custom Highlight API. Clears the highlight when the range changes or the
 * player unmounts.
 */
export function useParagraphHighlight(range: Range | null): void {
  useEffect(() => {
    if (!range) return;
    const doc = range.startContainer.ownerDocument;
    if (!doc) return;
    injectHighlightStyle(doc);

    const win = doc.defaultView as HighlightCapableWindow | null;
    const registry = win?.CSS?.highlights;
    const HighlightCtor = win?.Highlight;
    if (!registry || !HighlightCtor) return;

    registry.set("read-aloud", new HighlightCtor(range));
    return () => {
      registry.delete("read-aloud");
    };
  }, [range]);
}

import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { resolveTocContext } from "../utils/tocUtils";

export function useCurrentChapter() {
  const tocLabel = useStore((state) => state.progress.tocLabel);
  const currentTocHref = useStore((state) => state.currentTocHref);
  const book = useStore((state) => state.book);

  return useMemo(
    () =>
      resolveTocContext(
        currentTocHref,
        book?.toc,
        tocLabel || "Current Chapter"
      ),
    [currentTocHref, book?.toc, tocLabel]
  );
}
import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { resolveTocContext } from "../utils/tocUtils";
import { useChapterScopeDepth } from "./useChapterScopeDepth";

export function useCurrentChapter() {
  const tocLabel = useStore((state) => state.progress.tocLabel);
  const currentTocHref = useStore((state) => state.currentTocHref);
  const book = useStore((state) => state.book);
  const chapterScopeDepth = useChapterScopeDepth();

  return useMemo(
    () =>
      resolveTocContext(
        currentTocHref,
        book?.toc,
        tocLabel || "Current Chapter",
        chapterScopeDepth
      ),
    [currentTocHref, book?.toc, tocLabel, chapterScopeDepth]
  );
}

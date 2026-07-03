import { useStore } from "../store/useStore";

export function useCurrentChapter() {
  const tocLabel = useStore((state) => state.progress.tocLabel);
  const currentTocHref = useStore((state) => state.currentTocHref);

  return {
    chapterLabel: tocLabel || "Current Chapter",
    chapterHref: currentTocHref || "default",
  };
}

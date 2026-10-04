import { useStore } from "../store/useStore";

/**
 * The table of contents depth this book treats as "a chapter".
 *
 * `null` means the reader has not chosen one, so the original behaviour stays:
 * previews use the outermost level and Ask AI uses the exact entry.
 */
export function useChapterScopeDepth(): number | null {
  return useStore((state) => {
    const book = state.library.find((b) => b.id === state.currentBookId);
    const depth = book?.chapterScopeDepth;
    return typeof depth === "number" ? depth : null;
  });
}

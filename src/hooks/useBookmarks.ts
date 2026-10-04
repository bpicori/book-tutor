import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store/useStore";
import type { Bookmark } from "../types";

/**
 * Reduces a location CFI to the element that holds it, dropping the text range.
 *
 * `epubcfi(/6/14[chap03]!/4/2/2/16,/1:0,/1:24)` describes a paragraph (the
 * part before the comma) and a range inside it. The paragraph is the finest
 * stable unit shared by every location on one page, so it is what decides
 * whether the page on screen is where the bookmark sits.
 */
function cfiAnchor(cfi: string): string {
  const [element, range] = cfi.split(",");
  const parts = element.split("/");
  // The last step is the textual node the range starts in; the step before it
  // is the element itself.
  if (range !== undefined && parts.length > 2) {
    return parts.slice(0, -1).join("/");
  }
  return element;
}

export function isSamePage(a: string, b: string): boolean {
  return cfiAnchor(a) === cfiAnchor(b);
}

/** Rounded reading position used in the bookmark label. */
function percentLabel(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export interface UseBookmarksResult {
  /**
   * The bookmark for the open book, if the reader placed one. There is only
   * ever one per book, so it can be anywhere in the book.
   */
  bookmark: Bookmark | null;
  /** True when the bookmark sits on the page currently on screen. */
  isCurrentPageBookmarked: boolean;
  /** False when there is no location to save yet. */
  canBookmark: boolean;
  /** Places the bookmark on this page, or removes it if it is already here. */
  toggleBookmark: () => void;
  /** Removes the bookmark wherever it is in the book. */
  clearBookmark: () => void;
}

export function useBookmarks(): UseBookmarksResult {
  const {
    bookmarks,
    currentBookId,
    progress,
    currentSectionIndex,
    currentTocHref,
    setBookmark,
    removeBookmark,
  } = useStore(
    useShallow((state) => ({
      bookmarks: state.bookmarks,
      currentBookId: state.currentBookId,
      progress: state.progress,
      currentSectionIndex: state.currentSectionIndex,
      currentTocHref: state.currentTocHref,
      setBookmark: state.setBookmark,
      removeBookmark: state.removeBookmark,
    }))
  );

  const bookmark = useMemo(
    () => (currentBookId ? (bookmarks[currentBookId] ?? null) : null),
    [bookmarks, currentBookId]
  );

  const cfi = progress.cfi;
  const isCurrentPageBookmarked = Boolean(
    bookmark && cfi && isSamePage(bookmark.cfi, cfi)
  );

  const toggleBookmark = useCallback(() => {
    if (!currentBookId || !cfi) return;

    // Like a physical bookmark: putting it down here picks it up from there.
    if (bookmark && isSamePage(bookmark.cfi, cfi)) {
      removeBookmark(currentBookId);
      return;
    }

    const chapterLabel = progress.tocLabel?.trim() || "Bookmark";
    setBookmark({
      id: crypto.randomUUID(),
      bookId: currentBookId,
      cfi,
      sectionIndex: currentSectionIndex ?? 0,
      label: `${chapterLabel} · ${percentLabel(progress.fraction)}`,
      chapterHref: currentTocHref ?? undefined,
      chapterLabel: progress.tocLabel,
      fraction: progress.fraction,
      createdAt: Date.now(),
    });
  }, [
    currentBookId,
    cfi,
    bookmark,
    progress.tocLabel,
    progress.fraction,
    currentSectionIndex,
    currentTocHref,
    setBookmark,
    removeBookmark,
  ]);

  const clearBookmark = useCallback(() => {
    if (!currentBookId) return;
    removeBookmark(currentBookId);
  }, [currentBookId, removeBookmark]);

  return {
    bookmark,
    isCurrentPageBookmarked,
    canBookmark: Boolean(currentBookId && cfi),
    toggleBookmark,
    clearBookmark,
  };
}

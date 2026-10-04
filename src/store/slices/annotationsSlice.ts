import type { StateCreator } from "zustand";
import type { Bookmark, Highlight, HighlightColor } from "../../types";

/** One bookmark per book: placing a new one moves it. */
export type BookmarksByBook = Record<string, Bookmark>;

export interface AnnotationsSlice {
  highlights: Highlight[];
  bookmarks: BookmarksByBook;
  addHighlight: (highlight: Highlight) => void;
  updateHighlight: (
    id: string,
    updates: { color?: HighlightColor; note?: string }
  ) => void;
  removeHighlight: (id: string) => void;
  /** Places the book's bookmark, replacing any bookmark already in that book. */
  setBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (bookId: string) => void;
}

export const createAnnotationsSlice: StateCreator<AnnotationsSlice> = (
  set
) => ({
  highlights: [],
  bookmarks: {},

  addHighlight: (highlight) =>
    set((state) => ({
      highlights: [...state.highlights, highlight],
    })),

  updateHighlight: (id, updates) =>
    set((state) => ({
      highlights: state.highlights.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    })),

  removeHighlight: (id) =>
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    })),

  setBookmark: (bookmark) =>
    set((state) => ({
      bookmarks: { ...state.bookmarks, [bookmark.bookId]: bookmark },
    })),

  removeBookmark: (bookId) =>
    set((state) => {
      const { [bookId]: _removed, ...rest } = state.bookmarks;
      return { bookmarks: rest };
    }),
});

import type { StateCreator } from "zustand";
import type { Highlight, HighlightColor } from "../../types";

export interface AnnotationsSlice {
  highlights: Highlight[];

  addHighlight: (highlight: Highlight) => void;
  updateHighlight: (
    id: string,
    updates: { color?: HighlightColor; note?: string }
  ) => void;
  removeHighlight: (id: string) => void;
  getBookHighlights: (bookId: string) => Highlight[];
}

export const createAnnotationsSlice: StateCreator<AnnotationsSlice> = (
  set,
  get
) => ({
  highlights: [],

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

  getBookHighlights: (bookId) => {
    return get().highlights.filter((h) => h.bookId === bookId);
  },
});

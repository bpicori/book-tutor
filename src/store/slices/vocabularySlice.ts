import type { StateCreator } from "zustand";
import type { SavedWord } from "../../types";

export interface VocabularySlice {
  // State
  words: SavedWord[];

  // Actions
  addWord: (word: SavedWord) => void;
  removeWord: (wordId: string) => void;
  getWords: () => SavedWord[];
}

export const createVocabularySlice: StateCreator<VocabularySlice> = (
  set,
  get
) => ({
  // Initial state
  words: [],

  // Actions
  addWord: (word) =>
    set((state) => ({
      words: [word, ...state.words],
    })),

  removeWord: (wordId) =>
    set((state) => ({
      words: state.words.filter((w) => w.id !== wordId),
    })),

  getWords: () => {
    return get().words;
  },
});

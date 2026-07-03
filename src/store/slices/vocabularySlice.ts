import type { StateCreator } from "zustand";
import type { SavedWord } from "../../types";

export interface VocabularySlice {
  words: SavedWord[];
  addWord: (word: SavedWord) => void;
  removeWord: (wordId: string) => void;
}

export const createVocabularySlice: StateCreator<VocabularySlice> = (set) => ({
  words: [],

  addWord: (word) =>
    set((state) => ({
      words: [word, ...state.words],
    })),

  removeWord: (wordId) =>
    set((state) => ({
      words: state.words.filter((w) => w.id !== wordId),
    })),
});

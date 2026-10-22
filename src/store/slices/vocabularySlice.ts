import type { StateCreator } from "zustand";
import type { SavedWord } from "../../types";

export interface VocabularySlice {
  words: SavedWord[];
  addWord: (word: SavedWord) => void;
  removeWord: (wordId: string) => void;
  /** Puts a removed word back at the position it had before Undo. */
  restoreWord: (word: SavedWord, index: number) => void;
  setWordKnown: (wordId: string, known: boolean) => void;
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

  restoreWord: (word, index) =>
    set((state) => {
      if (state.words.some((entry) => entry.id === word.id)) return state;
      const next = [...state.words];
      const target = Math.max(0, Math.min(index, next.length));
      next.splice(target, 0, word);
      return { words: next };
    }),

  setWordKnown: (wordId, known) =>
    set((state) => ({
      words: state.words.map((word) =>
        word.id === wordId ? { ...word, known } : word
      ),
    })),
});

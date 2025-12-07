import type { StateCreator } from "zustand";
import type { LibraryBook, AppPage } from "../../types";

export interface LibrarySlice {
  // State
  currentView: AppPage;
  currentBookId: string | null;
  library: LibraryBook[];

  // Actions
  setCurrentView: (view: AppPage) => void;
  openBook: (bookId: string) => void;
  goToLibrary: () => void;
  goToVocabulary: () => void;
  addBookToLibrary: (book: LibraryBook) => void;
  removeBookFromLibrary: (bookId: string) => void;
  updateBookProgress: (bookId: string, progress: number) => void;
  updateBookLocation: (bookId: string, location: string) => void;
}

export const createLibrarySlice: StateCreator<LibrarySlice> = (set) => ({
  // Initial state
  currentView: "library",
  currentBookId: null,
  library: [],

  // Actions
  setCurrentView: (view) => set({ currentView: view }),

  openBook: (bookId) =>
    set((state) => ({
      currentView: "reader",
      currentBookId: bookId,
      library: state.library.map((b) =>
        b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
      ),
    })),

  goToLibrary: () =>
    set({
      currentView: "library",
      currentBookId: null,
    }),

  goToVocabulary: () =>
    set({
      currentView: "vocabulary",
      currentBookId: null,
    }),

  addBookToLibrary: (book) =>
    set((state) => ({ library: [...state.library, book] })),

  removeBookFromLibrary: (bookId) =>
    set((state) => ({ library: state.library.filter((b) => b.id !== bookId) })),

  updateBookProgress: (bookId, progress) =>
    set((state) => ({
      library: state.library.map((b) =>
        b.id === bookId ? { ...b, progress } : b
      ),
    })),

  updateBookLocation: (bookId, location) =>
    set((state) => ({
      library: state.library.map((b) =>
        b.id === bookId ? { ...b, lastLocation: location } : b
      ),
    })),
});

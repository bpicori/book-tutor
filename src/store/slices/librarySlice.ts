import type { StateCreator } from "zustand";
import type { LibraryBook } from "../../types";

export interface LibrarySlice {
  currentBookId: string | null;
  library: LibraryBook[];

  addBookToLibrary: (book: LibraryBook) => void;
  removeBookFromLibrary: (bookId: string) => void;
  updateBookProgress: (bookId: string, progress: number) => void;
  updateBookLocation: (bookId: string, location: string) => void;
}

export const createLibrarySlice: StateCreator<LibrarySlice> = (set) => ({
  currentBookId: null,
  library: [],

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

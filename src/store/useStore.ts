import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChapterPreview } from "../types";
import { STORAGE_KEY } from "../constants";
import { createLibrarySlice, type LibrarySlice } from "./slices/librarySlice";
import {
  createReaderSlice,
  type ReaderSlice,
  initialReaderState,
} from "./slices/readerSlice";
import { createUISlice, type UISlice } from "./slices/uiSlice";
import {
  createAISidebarSlice,
  type AISidebarSlice,
} from "./slices/aiSidebarSlice";
import {
  createVocabularySlice,
  type VocabularySlice,
} from "./slices/vocabularySlice";

// Initial state for AI sidebar reset (excludes chapterPreviews to preserve them)
const initialAISidebarStateWithoutPreviews = {
  activeAiTab: "preview" as const,
  chapterChats: {},
  previewLoading: false,
};

export interface AppState
  extends LibrarySlice, ReaderSlice, UISlice, AISidebarSlice, VocabularySlice {
  // Additional actions that need to coordinate multiple slices
  openBook: (bookId: string) => void;
  goToLibrary: () => void;
  goToVocabulary: () => void;

  // Selectors (moved from actions to avoid re-render issues)
  getChatMessages: (chapterHref: string) => ChatMessage[];
  getChapterPreview: (chapterHref: string) => ChapterPreview | null;
}

export const useStore = create<AppState>()(
  persist(
    (set, get, api) => {
      const librarySlice = createLibrarySlice(set, get, api);
      const readerSlice = createReaderSlice(set, get, api);
      const uiSlice = createUISlice(set, get, api);
      const aiSidebarSlice = createAISidebarSlice(set, get, api);
      const vocabularySlice = createVocabularySlice(set, get, api);

      return {
        ...librarySlice,
        ...readerSlice,
        ...uiSlice,
        ...aiSidebarSlice,
        ...vocabularySlice,

        // Override openBook to reset reader and AI sidebar state (preserves chapterPreviews)
        openBook: (bookId) => {
          set((state) => {
            const updatedLibrary = state.library.map((b) =>
              b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
            );
            return {
              currentView: "reader",
              currentBookId: bookId,
              library: updatedLibrary,
              ...initialReaderState,
              ...initialAISidebarStateWithoutPreviews,
            };
          });
        },

        // Override goToLibrary to reset reader and AI sidebar state (preserves chapterPreviews)
        goToLibrary: () => {
          set({
            currentView: "library",
            currentBookId: null,
            ...initialReaderState,
            ...initialAISidebarStateWithoutPreviews,
          });
        },

        // Override goToVocabulary to reset reader and AI sidebar state (preserves chapterPreviews)
        goToVocabulary: () => {
          set({
            currentView: "vocabulary",
            currentBookId: null,
            ...initialReaderState,
            ...initialAISidebarStateWithoutPreviews,
          });
        },

        // Override removeBookFromLibrary to also clean up previews for the deleted book
        removeBookFromLibrary: (bookId) => {
          set((state) => {
            // Filter out previews for this book (keys start with "bookId:")
            const filteredPreviews = Object.fromEntries(
              Object.entries(state.chapterPreviews).filter(
                ([key]) => !key.startsWith(`${bookId}:`)
              )
            );
            return {
              library: state.library.filter((b) => b.id !== bookId),
              chapterPreviews: filteredPreviews,
            };
          });
        },

        // Selectors (using get() to avoid re-renders)
        getChatMessages: (chapterHref: string) => {
          return get().chapterChats[chapterHref] || [];
        },

        getChapterPreview: (chapterHref: string) => {
          return get().chapterPreviews[chapterHref] || null;
        },
      };
    },
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        currentView: state.currentView,
        currentBookId: state.currentBookId,
        library: state.library,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isAiSidebarOpen: state.isAiSidebarOpen,
        settings: state.settings,
        words: state.words,
        chapterPreviews: state.chapterPreviews,
      }),
      merge: (persistedState: unknown, currentState: AppState) => {
        return { ...currentState, ...(persistedState as AppState) } as AppState;
      },
    }
  )
);

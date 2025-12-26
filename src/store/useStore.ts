import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChapterPreview } from "../types";
import { STORAGE_KEY } from "../constants";
import { createLibrarySlice, type LibrarySlice } from "./slices/librarySlice";
import { createReaderSlice, type ReaderSlice } from "./slices/readerSlice";
import { createUISlice, type UISlice } from "./slices/uiSlice";
import {
  createAISidebarSlice,
  type AISidebarSlice,
} from "./slices/aiSidebarSlice";
import {
  createVocabularySlice,
  type VocabularySlice,
} from "./slices/vocabularySlice";
import {
  createCloudSyncSlice,
  type CloudSyncSlice,
} from "./slices/cloudSyncSlice";

export interface AppState
  extends LibrarySlice, ReaderSlice, UISlice, AISidebarSlice, VocabularySlice, CloudSyncSlice {
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
      const cloudSyncSlice = createCloudSyncSlice(set, get, api);

      return {
        ...librarySlice,
        ...readerSlice,
        ...uiSlice,
        ...aiSidebarSlice,
        ...vocabularySlice,
        ...cloudSyncSlice,

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
        // currentView is no longer persisted - routing is handled by URL
        currentBookId: state.currentBookId,
        library: state.library,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isAiSidebarOpen: state.isAiSidebarOpen,
        settings: state.settings,
        words: state.words,
        chapterPreviews: state.chapterPreviews,
        cloudSync: state.cloudSync,
      }),
      merge: (persistedState: unknown, currentState: AppState) => {
        try {
          const persisted = (persistedState || {}) as Partial<AppState>;
          return {
            ...currentState,
            ...persisted,
          };
        } catch (error) {
          console.error("Error merging persisted state:", error);
          // Return current state on error to prevent app crash
          return currentState;
        }
      },
    }
  )
);

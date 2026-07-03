import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChapterChats } from "../types";
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
import {
  createAnnotationsSlice,
  type AnnotationsSlice,
} from "./slices/annotationsSlice";

export interface AppState
  extends
    LibrarySlice,
    ReaderSlice,
    UISlice,
    AISidebarSlice,
    VocabularySlice,
    CloudSyncSlice,
    AnnotationsSlice {}

function migrateChapterChats(
  chapterChats: ChapterChats | undefined,
  currentBookId: string | null | undefined
): ChapterChats {
  if (!chapterChats || !currentBookId) return chapterChats ?? {};

  const migrated: ChapterChats = {};
  for (const [key, messages] of Object.entries(chapterChats)) {
    const migratedKey = key.includes(":") ? key : `${currentBookId}:${key}`;
    migrated[migratedKey] = messages;
  }
  return migrated;
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
      const annotationsSlice = createAnnotationsSlice(set, get, api);

      return {
        ...librarySlice,
        ...readerSlice,
        ...uiSlice,
        ...aiSidebarSlice,
        ...vocabularySlice,
        ...cloudSyncSlice,
        ...annotationsSlice,

        removeBookFromLibrary: (bookId) => {
          set((state) => {
            const filteredPreviews = Object.fromEntries(
              Object.entries(state.chapterPreviews).filter(
                ([key]) => !key.startsWith(`${bookId}:`)
              )
            );
            const filteredChats = Object.fromEntries(
              Object.entries(state.chapterChats).filter(
                ([key]) => !key.startsWith(`${bookId}:`)
              )
            );
            return {
              library: state.library.filter((b) => b.id !== bookId),
              chapterPreviews: filteredPreviews,
              chapterChats: filteredChats,
              highlights: state.highlights.filter((h) => h.bookId !== bookId),
            };
          });
        },
      };
    },
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        currentBookId: state.currentBookId,
        library: state.library,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isAiSidebarOpen: state.isAiSidebarOpen,
        settings: state.settings,
        words: state.words,
        chapterPreviews: state.chapterPreviews,
        highlights: state.highlights,
        cloudSync: state.cloudSync,
      }),
      merge: (persistedState: unknown, currentState: AppState) => {
        try {
          const persisted = (persistedState || {}) as Partial<AppState>;
          return {
            ...currentState,
            ...persisted,
            chapterChats: migrateChapterChats(
              persisted.chapterChats,
              persisted.currentBookId
            ),
          };
        } catch (error) {
          console.error("Error merging persisted state:", error);
          return currentState;
        }
      },
    }
  )
);

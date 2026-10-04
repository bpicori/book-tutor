import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Bookmark, ChapterChats } from "../types";
import { STORAGE_KEY } from "../constants";
import {
  readSnapshot,
  stripStreaming,
  writeWithQuotaRecovery,
  type PersistedEnvelope,
} from "./persistStorage";
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
  persistedChats: unknown,
  currentBookId: string | null | undefined
): ChapterChats {
  if (!persistedChats || typeof persistedChats !== "object") return {};
  const chats = persistedChats as Record<string, unknown>;
  if (!currentBookId) return chats as ChapterChats;

  const migrated: ChapterChats = {};
  for (const [key, value] of Object.entries(chats)) {
    if (!value || typeof value !== "object") continue;
    const migratedKey = key.includes(":") ? key : `${currentBookId}:${key}`;
    // Snapshots written before conversations carried metadata.
    migrated[migratedKey] = Array.isArray(value)
      ? { messages: value, updatedAt: Date.now() }
      : (value as ChapterChats[string]);
  }
  return migrated;
}

/**
 * Bookmarks are one per book. Snapshots from the first release stored a list,
 * so the most recent bookmark of each book is kept and the rest are dropped.
 */
function migrateBookmarks(
  persistedBookmarks: unknown
): AnnotationsSlice["bookmarks"] {
  if (!persistedBookmarks) return {};
  if (!Array.isArray(persistedBookmarks)) {
    return persistedBookmarks as AnnotationsSlice["bookmarks"];
  }

  const newestPerBook: AnnotationsSlice["bookmarks"] = {};
  for (const entry of persistedBookmarks) {
    const bookmark = entry as Bookmark | undefined;
    if (!bookmark?.bookId || !bookmark.cfi) continue;
    const existing = newestPerBook[bookmark.bookId];
    if (!existing || bookmark.createdAt > existing.createdAt) {
      newestPerBook[bookmark.bookId] = bookmark;
    }
  }
  return newestPerBook;
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
            const { [bookId]: _removedBookmark, ...remainingBookmarks } =
              state.bookmarks;
            return {
              library: state.library.filter((b) => b.id !== bookId),
              chapterPreviews: filteredPreviews,
              chapterChats: filteredChats,
              highlights: state.highlights.filter((h) => h.bookId !== bookId),
              bookmarks: remainingBookmarks,
            };
          });
        },
      };
    },
    {
      name: STORAGE_KEY,
      // Local storage writes a quota-safe snapshot: in-flight streaming
      // messages are stripped, and a full quota trims old conversations
      // instead of losing state.
      storage: createJSONStorage(() => ({
        getItem: (): string | null => readSnapshot(),
        setItem: (_name: string, value: string): void => {
          try {
            writeWithQuotaRecovery(JSON.parse(value) as PersistedEnvelope);
          } catch (error) {
            console.error("Failed to persist state:", error);
          }
        },
        removeItem: (): void => {
          window.localStorage.removeItem(STORAGE_KEY);
        },
      })),
      partialize: (state) => {
        const persistedChats = stripStreaming(state.chapterChats);
        return {
          currentBookId: state.currentBookId,
          library: state.library,
          isSidebarCollapsed: state.isSidebarCollapsed,
          isAiSidebarOpen: state.isAiSidebarOpen,
          settings: state.settings,
          words: state.words,
          chapterPreviews: state.chapterPreviews,
          // Conversations survive navigation and refresh.
          chapterChats: persistedChats,
          highlights: state.highlights,
          bookmarks: state.bookmarks,
          cloudSync: state.cloudSync,
        };
      },
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
            bookmarks: migrateBookmarks(persisted.bookmarks),
          };
        } catch (error) {
          console.error("Error merging persisted state:", error);
          return currentState;
        }
      },
    }
  )
);

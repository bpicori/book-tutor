import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ChatMessage,
  ChapterPreview,
  LLMProvider,
  LLMProviderAssignments,
} from "../types";
import {
  STORAGE_KEY,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_ASSIGNMENTS,
} from "../constants";
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
import type { ReaderSettings } from "../types";

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

        // Navigation functions are now handled by useNavigation hook
        // These are kept for backward compatibility but should not be used directly
        openBook: (_bookId) => {
          // This function is deprecated - use useNavigation().openBook instead
          console.warn(
            "openBook from store is deprecated, use useNavigation().openBook instead"
          );
        },

        goToLibrary: () => {
          // This function is deprecated - use useNavigation().goToLibrary instead
          console.warn(
            "goToLibrary from store is deprecated, use useNavigation().goToLibrary instead"
          );
        },

        goToVocabulary: () => {
          // This function is deprecated - use useNavigation().goToVocabulary instead
          console.warn(
            "goToVocabulary from store is deprecated, use useNavigation().goToVocabulary instead"
          );
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
        // currentView is no longer persisted - routing is handled by URL
        currentBookId: state.currentBookId,
        library: state.library,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isAiSidebarOpen: state.isAiSidebarOpen,
        settings: state.settings,
        words: state.words,
        chapterPreviews: state.chapterPreviews,
      }),
      merge: (persistedState: unknown, currentState: AppState) => {
        try {
          const persisted = (persistedState || {}) as Partial<AppState>;
          const persistedSettings = (persisted.settings ||
            {}) as Partial<ReaderSettings>;
          const currentSettings = currentState.settings;

          // Migrate old LLM settings to new provider format
          let migratedProviders: LLMProvider[] =
            currentSettings.llmProviders || [];
          let migratedAssignments: LLMProviderAssignments =
            currentSettings.llmAssignments || DEFAULT_LLM_ASSIGNMENTS;

          // Check if we need to migrate from old format
          if (
            !persistedSettings.llmProviders ||
            !Array.isArray(persistedSettings.llmProviders) ||
            persistedSettings.llmProviders.length === 0
          ) {
            // Migration needed: create providers from old flat settings
            const providers: LLMProvider[] = [];
            const assignments: LLMProviderAssignments = {
              previewProvider: null,
              askProvider: null,
              translationProvider: null,
            };

            // Create main provider from old settings
            if (
              persistedSettings.llmApiKey ||
              persistedSettings.llmBaseUrl ||
              persistedSettings.llmModel
            ) {
              const mainProvider: LLMProvider = {
                id: "main",
                name: "Main",
                apiKey: persistedSettings.llmApiKey || "",
                baseUrl:
                  persistedSettings.llmBaseUrl || DEFAULT_LLM_PROVIDER.baseUrl,
                model: persistedSettings.llmModel || DEFAULT_LLM_PROVIDER.model,
              };
              providers.push(mainProvider);
              assignments.previewProvider = "main";
              assignments.askProvider = "main";
            }

            // Create translation provider if different from main
            const hasTranslationSettings =
              persistedSettings.llmTranslationApiKey ||
              persistedSettings.llmTranslationBaseUrl ||
              persistedSettings.llmTranslationModel;

            if (hasTranslationSettings) {
              const translationProvider: LLMProvider = {
                id: "translation",
                name: "Translation",
                apiKey:
                  persistedSettings.llmTranslationApiKey ||
                  persistedSettings.llmApiKey ||
                  "",
                baseUrl:
                  persistedSettings.llmTranslationBaseUrl ||
                  persistedSettings.llmBaseUrl ||
                  DEFAULT_LLM_PROVIDER.baseUrl,
                model:
                  persistedSettings.llmTranslationModel ||
                  persistedSettings.llmModel ||
                  DEFAULT_LLM_PROVIDER.model,
              };
              providers.push(translationProvider);
              assignments.translationProvider = "translation";
            } else if (providers.length > 0) {
              // Use main provider for translation if no separate translation settings
              assignments.translationProvider = "main";
            }

            // If no providers were created, use default
            if (providers.length === 0) {
              providers.push(DEFAULT_LLM_PROVIDER);
            }

            migratedProviders = providers;
            migratedAssignments = assignments;
          } else {
            // Use persisted providers and assignments if they exist
            if (Array.isArray(persistedSettings.llmProviders)) {
              migratedProviders = persistedSettings.llmProviders;
            }
            if (
              persistedSettings.llmAssignments &&
              typeof persistedSettings.llmAssignments === "object" &&
              "previewProvider" in persistedSettings.llmAssignments
            ) {
              migratedAssignments = persistedSettings.llmAssignments;
            }
          }

          return {
            ...currentState,
            ...persisted,
            // Merge settings to ensure new fields are preserved
            settings: {
              ...currentState.settings,
              ...persistedSettings,
              llmProviders: migratedProviders,
              llmAssignments: migratedAssignments,
            },
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

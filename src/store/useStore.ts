import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, ChapterPreview } from '../types'
import { STORAGE_KEY, DEFAULT_SETTINGS } from '../constants'
import { createLibrarySlice, type LibrarySlice } from './slices/librarySlice'
import { createReaderSlice, type ReaderSlice, initialReaderState } from './slices/readerSlice'
import { createUISlice, type UISlice } from './slices/uiSlice'
import { createAISidebarSlice, type AISidebarSlice } from './slices/aiSidebarSlice'

// Import initial states directly
const initialAISidebarState = {
  activeAiTab: 'preview' as const,
  chapterChats: {},
  chapterPreviews: {},
  previewLoading: false,
}

export interface AppState extends LibrarySlice, ReaderSlice, UISlice, AISidebarSlice {
  // Additional actions that need to coordinate multiple slices
  openBook: (bookId: string) => void
  goToLibrary: () => void
  
  // Selectors (moved from actions to avoid re-render issues)
  getChatMessages: (chapterHref: string) => ChatMessage[]
  getChapterPreview: (chapterHref: string) => ChapterPreview | null
}

export const useStore = create<AppState>()(
  persist(
    (set, get, api) => {
      const librarySlice = createLibrarySlice(set, get, api)
      const readerSlice = createReaderSlice(set, get, api)
      const uiSlice = createUISlice(set, get, api)
      const aiSidebarSlice = createAISidebarSlice(set, get, api)

      return {
        ...librarySlice,
        ...readerSlice,
        ...uiSlice,
        ...aiSidebarSlice,

        // Override openBook to reset reader and AI sidebar state
        openBook: (bookId) => {
          set((state) => {
            const updatedLibrary = state.library.map((b) =>
              b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
            )
            return {
              currentView: 'reader',
              currentBookId: bookId,
              library: updatedLibrary,
              ...initialReaderState,
              ...initialAISidebarState,
            }
          })
        },

        // Override goToLibrary to reset reader and AI sidebar state
        goToLibrary: () => {
          set({
            currentView: 'library',
            currentBookId: null,
            ...initialReaderState,
            ...initialAISidebarState,
          })
        },

        // Selectors (using get() to avoid re-renders)
        getChatMessages: (chapterHref: string) => {
          return get().chapterChats[chapterHref] || []
        },

        getChapterPreview: (chapterHref: string) => {
          return get().chapterPreviews[chapterHref] || null
        },
      }
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
      }),
      merge: (persistedState: any, currentState: AppState) => {
        const merged = { ...currentState, ...persistedState } as AppState
        
        // Migrate settings: ensure translation settings exist (backward compatibility)
        if (merged.settings && typeof merged.settings === 'object') {
          const oldSettings = merged.settings as any
          const needsMigration = 
            !('llmTranslationApiKey' in oldSettings) ||
            !('llmTranslationBaseUrl' in oldSettings) ||
            !('llmTranslationModel' in oldSettings)
          
          if (needsMigration) {
            merged.settings = {
              ...DEFAULT_SETTINGS,
              ...oldSettings,
              // Migrate: use main settings as defaults for translation if not set
              llmTranslationApiKey: oldSettings.llmTranslationApiKey || oldSettings.llmApiKey || '',
              llmTranslationBaseUrl: oldSettings.llmTranslationBaseUrl || oldSettings.llmBaseUrl || DEFAULT_SETTINGS.llmTranslationBaseUrl,
              llmTranslationModel: oldSettings.llmTranslationModel || oldSettings.llmModel || DEFAULT_SETTINGS.llmTranslationModel,
            }
          }
        }
        
        return merged
      },
    }
  )
)

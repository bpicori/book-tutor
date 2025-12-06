import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, ChapterPreview } from '../types'
import { STORAGE_KEY } from '../constants'
import { createLibrarySlice, type LibrarySlice } from './slices/librarySlice'
import { createReaderSlice, type ReaderSlice, initialReaderState } from './slices/readerSlice'
import { createUISlice, type UISlice } from './slices/uiSlice'
import { createAISidebarSlice, type AISidebarSlice } from './slices/aiSidebarSlice'
import { createVocabularySlice, type VocabularySlice } from './slices/vocabularySlice'

// Import initial states directly
const initialAISidebarState = {
  activeAiTab: 'preview' as const,
  chapterChats: {},
  chapterPreviews: {},
  previewLoading: false,
}

export interface AppState extends LibrarySlice, ReaderSlice, UISlice, AISidebarSlice, VocabularySlice {
  // Additional actions that need to coordinate multiple slices
  openBook: (bookId: string) => void
  goToLibrary: () => void
  goToVocabulary: () => void
  
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
      const vocabularySlice = createVocabularySlice(set, get, api)

      return {
        ...librarySlice,
        ...readerSlice,
        ...uiSlice,
        ...aiSidebarSlice,
        ...vocabularySlice,

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

        // Override goToVocabulary to reset reader and AI sidebar state
        goToVocabulary: () => {
          set({
            currentView: 'vocabulary',
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
        words: state.words,
      }),
      merge: (persistedState: any, currentState: AppState) => {
        return { ...currentState, ...persistedState } as AppState
      },
    }
  )
)

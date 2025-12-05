import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Book, LibraryBook, ChatMessage, ProgressInfo, AppPage, ReaderSettings } from '../types'

interface AppState {
  // Routing
  currentView: AppPage
  currentBookId: string | null

  // Library
  library: LibraryBook[]

  // Reader (runtime only)
  book: Book | null
  coverUrl: string | null
  progress: ProgressInfo
  currentTocHref: string | null

  // UI
  isAiSidebarOpen: boolean
  isSidebarCollapsed: boolean
  isSettingsOpen: boolean

  // Settings
  settings: ReaderSettings

  // Chat
  chatMessages: ChatMessage[]

  // Actions
  setCurrentView: (view: AppPage) => void
  openBook: (bookId: string) => void
  goToLibrary: () => void

  addBookToLibrary: (book: LibraryBook) => void
  removeBookFromLibrary: (bookId: string) => void
  updateBookProgress: (bookId: string, progress: number) => void

  setBook: (book: Book | null) => void
  setCoverUrl: (url: string | null) => void
  setProgress: (progress: ProgressInfo) => void
  setCurrentTocHref: (href: string | null) => void

  toggleAiSidebar: (open?: boolean) => void
  toggleSidebar: (collapsed?: boolean) => void
  toggleSettings: (open?: boolean) => void

  updateSettings: (settings: Partial<ReaderSettings>) => void
  resetSettings: () => void

  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
}

const initialReaderState = {
  book: null,
  coverUrl: null,
  progress: { fraction: 0 },
  currentTocHref: null,
  chatMessages: [],
}

const defaultSettings: ReaderSettings = {
  fontFamily: 'Literata',
  fontSize: 16,
  lineHeight: 1.6,
  viewMode: 'paginated',
  llmApiKey: '',
  llmBaseUrl: 'https://api.openai.com/v1',
  llmModel: 'gpt-4o-mini',
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      currentView: 'library',
      currentBookId: null,
      library: [],
      ...initialReaderState,
      isAiSidebarOpen: true,
      isSidebarCollapsed: false,
      isSettingsOpen: false,
      settings: defaultSettings,

      // Routing
      setCurrentView: (view) => set({ currentView: view }),

      openBook: (bookId) =>
        set((state) => ({
          currentView: 'reader',
          currentBookId: bookId,
          library: state.library.map((b) =>
            b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
          ),
          ...initialReaderState,
        })),

      goToLibrary: () =>
        set({
          currentView: 'library',
          currentBookId: null,
          ...initialReaderState,
        }),

      // Library
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

      // Reader
      setBook: (book) => set({ book }),
      setCoverUrl: (coverUrl) => set({ coverUrl }),
      setProgress: (progress) => set({ progress }),
      setCurrentTocHref: (currentTocHref) => set({ currentTocHref }),

      // UI
      toggleAiSidebar: (open) =>
        set((state) => ({
          isAiSidebarOpen: open ?? !state.isAiSidebarOpen,
        })),

      toggleSidebar: (collapsed) =>
        set((state) => ({
          isSidebarCollapsed: collapsed ?? !state.isSidebarCollapsed,
        })),

      toggleSettings: (open) =>
        set((state) => ({
          isSettingsOpen: open ?? !state.isSettingsOpen,
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set({ settings: defaultSettings }),

      // Chat
      addChatMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, message] })),

      clearChat: () => set({ chatMessages: [] }),
    }),
    {
      name: 'read-with-ai-storage',
      partialize: (state) => ({
        currentView: state.currentView,
        currentBookId: state.currentBookId,
        library: state.library,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isAiSidebarOpen: state.isAiSidebarOpen,
        settings: state.settings,
      }),
    }
  )
)

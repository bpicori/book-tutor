import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  Book, 
  LibraryBook, 
  ChatMessage, 
  ProgressInfo, 
  AppPage, 
  ReaderSettings,
  AiSidebarTab,
  ChapterPreview,
  ChapterChats,
  ChapterPreviews
} from '../types'

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
  currentSectionIndex: number | null

  // UI
  isAiSidebarOpen: boolean
  isSidebarCollapsed: boolean
  isSettingsOpen: boolean

  // Settings
  settings: ReaderSettings

  // AI Sidebar
  activeAiTab: AiSidebarTab
  chapterChats: ChapterChats
  chapterPreviews: ChapterPreviews
  previewLoading: boolean

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
  setCurrentSectionIndex: (index: number | null) => void

  toggleAiSidebar: (open?: boolean) => void
  toggleSidebar: (collapsed?: boolean) => void
  toggleSettings: (open?: boolean) => void

  updateSettings: (settings: Partial<ReaderSettings>) => void
  resetSettings: () => void

  // AI Sidebar Actions
  setActiveAiTab: (tab: AiSidebarTab) => void
  addChatMessage: (chapterHref: string, message: ChatMessage) => void
  updateLastChatMessage: (chapterHref: string, content: string, isStreaming?: boolean) => void
  getChatMessages: (chapterHref: string) => ChatMessage[]
  clearChapterChat: (chapterHref: string) => void
  
  setChapterPreview: (chapterHref: string, preview: ChapterPreview) => void
  getChapterPreview: (chapterHref: string) => ChapterPreview | null
  setPreviewLoading: (loading: boolean) => void
  clearChapterPreview: (chapterHref: string) => void
}

const initialReaderState = {
  book: null,
  coverUrl: null,
  progress: { fraction: 0 },
  currentTocHref: null,
  currentSectionIndex: null,
  chapterChats: {},
  chapterPreviews: {},
  previewLoading: false,
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
    (set, get) => ({
      // Initial state
      currentView: 'library',
      currentBookId: null,
      library: [],
      ...initialReaderState,
      isAiSidebarOpen: true,
      isSidebarCollapsed: false,
      isSettingsOpen: false,
      settings: defaultSettings,
      activeAiTab: 'preview',

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
      setCurrentSectionIndex: (currentSectionIndex) => set({ currentSectionIndex }),

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

      // AI Sidebar
      setActiveAiTab: (tab) => set({ activeAiTab: tab }),

      addChatMessage: (chapterHref, message) =>
        set((state) => {
          const currentMessages = state.chapterChats[chapterHref] || []
          return {
            chapterChats: {
              ...state.chapterChats,
              [chapterHref]: [...currentMessages, message],
            },
          }
        }),

      updateLastChatMessage: (chapterHref, content, isStreaming) =>
        set((state) => {
          const messages = [...(state.chapterChats[chapterHref] || [])]
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            messages[messages.length - 1] = {
              ...lastMessage,
              content,
              isStreaming: isStreaming ?? false,
            }
          }
          return {
            chapterChats: {
              ...state.chapterChats,
              [chapterHref]: messages,
            },
          }
        }),

      getChatMessages: (chapterHref) => {
        return get().chapterChats[chapterHref] || []
      },

      clearChapterChat: (chapterHref) =>
        set((state) => {
          const { [chapterHref]: _, ...rest } = state.chapterChats
          return { chapterChats: rest }
        }),

      setChapterPreview: (chapterHref, preview) =>
        set((state) => ({
          chapterPreviews: {
            ...state.chapterPreviews,
            [chapterHref]: preview,
          },
        })),

      getChapterPreview: (chapterHref) => {
        return get().chapterPreviews[chapterHref] || null
      },

      setPreviewLoading: (loading) => set({ previewLoading: loading }),

      clearChapterPreview: (chapterHref) =>
        set((state) => {
          const { [chapterHref]: _, ...rest } = state.chapterPreviews
          return { chapterPreviews: rest }
        }),
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

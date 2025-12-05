import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface TOCItem {
  label: string
  href: string
  subitems?: TOCItem[]
}

export interface BookMetadata {
  title?: string
  author?: string | string[]
  description?: string
  language?: string
}

export interface Book {
  metadata?: BookMetadata
  toc?: TOCItem[]
  getCover?(): Promise<Blob | null>
}

export interface FoliateView extends HTMLElement {
  book?: Book
  open(file: File): Promise<void>
  init(options: { lastLocation?: string; showTextStart?: boolean }): Promise<void>
  prev(): Promise<void>
  next(): Promise<void>
  goLeft(): Promise<void>
  goRight(): Promise<void>
  goTo(target: string | number): Promise<void>
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProgressInfo {
  fraction: number // 0-1, representing the progress of the book
  tocLabel?: string // the label of the current toc item
}

// Library book info (serializable metadata only)
export interface LibraryBook {
  id: string
  title: string
  author: string
  coverDataUrl: string | null // Base64 data URL for cover image
  addedAt: number
  lastReadAt: number | null
  progress: number // 0-1
}

// Page routing
export type AppPage = 'library' | 'reader'

interface AppState {
  // Page routing
  currentPage: AppPage
  currentBookId: string | null

  // Library state (persisted)
  library: LibraryBook[]

  // Book state (runtime only - not persisted)
  book: Book | null
  coverUrl: string | null
  progress: ProgressInfo
  currentTocHref: string | null

  // UI state
  isAiSidebarOpen: boolean
  isSidebarCollapsed: boolean

  // Chat state
  chatMessages: ChatMessage[]

  // Page routing actions
  setCurrentPage: (page: AppPage) => void
  openBook: (bookId: string) => void
  goToLibrary: () => void

  // Library actions
  addBookToLibrary: (book: LibraryBook) => void
  removeBookFromLibrary: (bookId: string) => void
  updateBookProgress: (bookId: string, progress: number) => void
  updateBookLastRead: (bookId: string) => void

  // Book actions
  setBook: (book: Book | null) => void
  setCoverUrl: (url: string | null) => void
  setProgress: (progress: ProgressInfo) => void
  setCurrentTocHref: (href: string | null) => void

  // UI actions
  toggleAiSidebar: (open?: boolean) => void
  toggleSidebar: (collapsed?: boolean) => void

  // Chat actions
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      currentPage: 'library',
      currentBookId: null,
      library: [],
      book: null,
      coverUrl: null,
      progress: { fraction: 0 },
      currentTocHref: null,
      isAiSidebarOpen: true,
      isSidebarCollapsed: false,
      chatMessages: [],

      // Page routing actions
      setCurrentPage: (page) => set({ currentPage: page }),

      openBook: (bookId) =>
        set((state) => {
          // Update last read time
          const library = state.library.map((b) =>
            b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
          )
          return {
            currentPage: 'reader',
            currentBookId: bookId,
            library,
            // Reset reader state
            book: null,
            coverUrl: null,
            progress: { fraction: 0 },
            currentTocHref: null,
            chatMessages: [],
          }
        }),

      goToLibrary: () =>
        set({
          currentPage: 'library',
          currentBookId: null,
          book: null,
          coverUrl: null,
          progress: { fraction: 0 },
          currentTocHref: null,
        }),

      // Library actions
      addBookToLibrary: (book) =>
        set((state) => ({
          library: [...state.library, book],
        })),

      removeBookFromLibrary: (bookId) =>
        set((state) => ({
          library: state.library.filter((b) => b.id !== bookId),
        })),

      updateBookProgress: (bookId, progress) =>
        set((state) => ({
          library: state.library.map((b) =>
            b.id === bookId ? { ...b, progress } : b
          ),
        })),

      updateBookLastRead: (bookId) =>
        set((state) => ({
          library: state.library.map((b) =>
            b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
          ),
        })),

      // Book actions
      setBook: (book) => set({ book }),

      setCoverUrl: (coverUrl) => set({ coverUrl }),

      setProgress: (progress) => set({ progress }),

      setCurrentTocHref: (currentTocHref) => set({ currentTocHref }),

      // UI actions
      toggleAiSidebar: (open) =>
        set((state) => ({
          isAiSidebarOpen: open !== undefined ? open : !state.isAiSidebarOpen,
        })),

      toggleSidebar: (collapsed) =>
        set((state) => ({
          isSidebarCollapsed:
            collapsed !== undefined ? collapsed : !state.isSidebarCollapsed,
        })),

      // Chat actions
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),

      clearChat: () => set({ chatMessages: [] }),
    }),
    {
      name: 'read-with-ai-storage',
      // Only persist these fields
      partialize: (state) => ({
        currentPage: state.currentPage,
        currentBookId: state.currentBookId,
        library: state.library,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isAiSidebarOpen: state.isAiSidebarOpen,
      }),
    }
  )
)

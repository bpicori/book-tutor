import { create } from 'zustand'

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

interface AppState {
  // Book state
  book: Book | null
  coverUrl: string | null
  progress: ProgressInfo
  currentTocHref: string | null

  // UI state
  isAiSidebarOpen: boolean
  isSidebarCollapsed: boolean

  // Chat state
  chatMessages: ChatMessage[]

  // Actions
  setBook: (book: Book | null) => void
  setCoverUrl: (url: string | null) => void
  setProgress: (progress: ProgressInfo) => void
  setCurrentTocHref: (href: string | null) => void
  toggleAiSidebar: (open?: boolean) => void
  toggleSidebar: (collapsed?: boolean) => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  book: null,
  coverUrl: null,
  progress: { fraction: 0 },
  currentTocHref: null,
  isAiSidebarOpen: true,
  isSidebarCollapsed: false,
  chatMessages: [],

  // Actions
  setBook: (book) => set({ book }),
  
  setCoverUrl: (coverUrl) => set({ coverUrl }),
  
  setProgress: (progress) => set({ progress }),
  
  setCurrentTocHref: (currentTocHref) => set({ currentTocHref }),
  
  toggleAiSidebar: (open) =>
    set((state) => ({
      isAiSidebarOpen: open !== undefined ? open : !state.isAiSidebarOpen,
    })),
  
  toggleSidebar: (collapsed) =>
    set((state) => ({
      isSidebarCollapsed: collapsed !== undefined ? collapsed : !state.isSidebarCollapsed,
    })),
  
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  
  clearChat: () => set({ chatMessages: [] }),
}))


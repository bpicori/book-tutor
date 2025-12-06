import type { StateCreator } from 'zustand'
import type { Book, ProgressInfo } from '../../types'

export interface ReaderSlice {
  // State
  book: Book | null
  coverUrl: string | null
  progress: ProgressInfo
  currentTocHref: string | null
  currentSectionIndex: number | null

  // Actions
  setBook: (book: Book | null) => void
  setCoverUrl: (url: string | null) => void
  setProgress: (progress: ProgressInfo) => void
  setCurrentTocHref: (href: string | null) => void
  setCurrentSectionIndex: (index: number | null) => void
  resetReaderState: () => void
}

export const initialReaderState = {
  book: null,
  coverUrl: null,
  progress: { fraction: 0 },
  currentTocHref: null,
  currentSectionIndex: null,
}

export const createReaderSlice: StateCreator<ReaderSlice> = (set) => ({
  // Initial state
  ...initialReaderState,

  // Actions
  setBook: (book) => set({ book }),
  setCoverUrl: (coverUrl) => set({ coverUrl }),
  setProgress: (progress) => set({ progress }),
  setCurrentTocHref: (currentTocHref) => set({ currentTocHref }),
  setCurrentSectionIndex: (currentSectionIndex) => set({ currentSectionIndex }),
  resetReaderState: () => set(initialReaderState),
})


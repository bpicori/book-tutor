// Book Types
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

// Library Types
export interface LibraryBook {
  id: string
  title: string
  author: string
  coverDataUrl: string | null
  addedAt: number
  lastReadAt: number | null
  progress: number
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Progress Types
export interface ProgressInfo {
  fraction: number
  tocLabel?: string
}

// App Types
export type AppPage = 'library' | 'reader'

// Settings Types
export interface ReaderSettings {
  // Typography
  fontFamily: string
  fontSize: number // 12-24
  lineHeight: number // 1.2-2.0
  
  // Reading
  viewMode: 'paginated' | 'scroll'
}


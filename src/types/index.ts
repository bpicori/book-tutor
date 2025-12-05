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

export interface BookSection {
  id: string | number
  createDocument(): Promise<Document>
  linear?: string
}

export interface Book {
  metadata?: BookMetadata
  toc?: TOCItem[]
  sections?: BookSection[]
  getCover?(): Promise<Blob | null>
  resolveHref?(href: string): { index: number; anchor?: (doc: Document) => Element | Range }
}

export interface FoliateRenderer extends HTMLElement {
  setStyles?(styles: string): void
}

export interface FoliateView extends HTMLElement {
  book?: Book
  renderer?: FoliateRenderer
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
  isStreaming?: boolean
}

// AI Sidebar Types
export type AiSidebarTab = 'preview' | 'ask'

export interface ChapterPreview {
  chapterHref: string
  chapterLabel: string
  themes: string[]
  keyConcepts: string[]
  toneAndStyle?: string
  characters?: string[]
  definitions?: Array<{ term: string; definition: string }>
  guidingQuestions: string[]
  generatedAt: number
}

export type ChapterChats = Record<string, ChatMessage[]>
export type ChapterPreviews = Record<string, ChapterPreview>

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
  
  // LLM Settings (OpenAI compatible)
  llmApiKey: string
  llmBaseUrl: string
  llmModel: string
}


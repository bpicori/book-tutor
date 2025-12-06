// Book Types

/**
 * Table of Contents item representing a chapter or section
 */
export interface TOCItem {
  label: string
  href: string
  subitems?: TOCItem[]
}

/**
 * Book metadata that can come in various formats:
 * - Plain strings
 * - Language maps: { en: "Title", de: "Titel" }
 * - Arrays of strings or objects
 * - Objects with name/value properties
 */
export interface BookMetadata {
  /** Book title - can be string, language map, or array */
  title?: string | Record<string, string> | string[] | Array<{ name?: string | Record<string, string> }>
  /** Author(s) - can be string, array of strings, or array of objects with name */
  author?: string | string[] | Array<{ name?: string | Record<string, string> }>
  /** Book description */
  description?: string | Record<string, string>
  /** Language code */
  language?: string
}

/**
 * Represents a section/chapter in a book
 */
export interface BookSection {
  id: string | number
  /** Creates a Document instance for this section */
  createDocument(): Promise<Document>
  /** Linear reading order identifier */
  linear?: string
}

/**
 * Book interface representing an EPUB or other book format
 */
export interface Book {
  /** Book metadata (title, author, etc.) */
  metadata?: BookMetadata
  /** Table of contents */
  toc?: TOCItem[]
  /** Book sections/chapters */
  sections?: BookSection[]
  /** Get cover image as Blob */
  getCover?(): Promise<Blob | null>
  /** Resolve an href to a section index and optional anchor function */
  resolveHref?(href: string): { index: number; anchor?: (doc: Document) => Element | Range }
}

/**
 * Foliate renderer component that applies styles to the book content
 */
export interface FoliateRenderer extends HTMLElement {
  /** Apply CSS styles to the rendered content */
  setStyles?(styles: string): void
}

/**
 * Foliate view component - the main reader element
 * 
 * @example
 * ```typescript
 * const view = document.createElement('foliate-view') as FoliateView
 * await view.open(epubFile)
 * await view.init({ showTextStart: true })
 * ```
 */
export interface FoliateView extends HTMLElement {
  /** The currently loaded book */
  book?: Book
  /** The renderer instance for styling */
  renderer?: FoliateRenderer
  /** Open a book file */
  open(file: File): Promise<void>
  /** Initialize the reader with options */
  init(options: { lastLocation?: string; showTextStart?: boolean }): Promise<void>
  /** Navigate to previous page */
  prev(): Promise<void>
  /** Navigate to next page */
  next(): Promise<void>
  /** Navigate left (for paginated view) */
  goLeft(): Promise<void>
  /** Navigate right (for paginated view) */
  goRight(): Promise<void>
  /** Navigate to a specific location (href string or section index) */
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
export interface LocationInfo {
  current: number
  total: number
}

export interface ProgressInfo {
  fraction: number
  tocLabel?: string
  location?: LocationInfo
}

// App Types
export type AppPage = 'library' | 'reader'

// Settings Types

/**
 * Typography settings for the reader
 */
export interface TypographySettings {
  fontFamily: string
  fontSize: number // 12-24
  lineHeight: number // 1.2-2.0
}

/**
 * Reader view mode settings
 */
export interface ViewSettings {
  viewMode: 'paginated' | 'scroll'
}

/**
 * LLM/API settings for AI features
 */
export interface LLMSettings {
  llmApiKey: string
  llmBaseUrl: string
  llmModel: string
}

/**
 * Combined reader settings (composed of separate concerns)
 * Maintained for backward compatibility with existing code
 */
export interface ReaderSettings extends TypographySettings, ViewSettings, LLMSettings {}


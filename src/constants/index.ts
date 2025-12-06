import type { ReaderSettings } from '../types'

/**
 * Storage key for Zustand persist middleware
 */
export const STORAGE_KEY = 'read-with-ai-storage'

/**
 * IndexedDB database configuration
 */
export const DB_NAME = 'read-with-ai-books'
export const DB_VERSION = 1
export const DB_STORE_NAME = 'books'

/**
 * Default reader settings
 */
export const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'Literata',
  fontSize: 16,
  lineHeight: 1.6,
  viewMode: 'paginated',
  llmApiKey: '',
  llmBaseUrl: 'https://api.openai.com/v1',
  llmModel: 'gpt-4o-mini',
  llmTranslationApiKey: '',
  llmTranslationBaseUrl: 'https://api.openai.com/v1',
  llmTranslationModel: 'gpt-4o-mini',
}

/**
 * Default LLM settings
 */
export const DEFAULT_LLM_BASE_URL = 'https://api.openai.com/v1'
export const DEFAULT_LLM_MODEL = 'gpt-4o-mini'


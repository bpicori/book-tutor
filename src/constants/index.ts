import type {
  ReaderSettings,
  Theme,
  LLMProvider,
  LLMProviderAssignments,
} from "../types";

/**
 * Storage key for Zustand persist middleware
 */
export const STORAGE_KEY = "read-with-ai-storage";

/**
 * IndexedDB database configuration
 */
export const DB_NAME = "read-with-ai-books";
export const DB_VERSION = 1;
export const DB_STORE_NAME = "books";

/**
 * Available themes with metadata
 */
export interface ThemeInfo {
  id: Theme;
  label: string;
  description: string;
}

export const THEMES: ThemeInfo[] = [
  {
    id: "sepia",
    label: "Sepia",
    description: "Warm, book-like reading experience",
  },
  {
    id: "solarized",
    label: "Solarized Light",
    description: "Eye-friendly light theme with teal accents",
  },
  {
    id: "nord",
    label: "Nord",
    description: "Cool arctic blue-gray palette",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Deep dark theme for low-light reading",
  },
];

/**
 * Default LLM provider
 */
export const DEFAULT_LLM_PROVIDER: LLMProvider = {
  id: "default",
  name: "Default",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
};

/**
 * Default LLM provider assignments
 */
export const DEFAULT_LLM_ASSIGNMENTS: LLMProviderAssignments = {
  previewProvider: null,
  askProvider: null,
  translationProvider: null,
};

/**
 * Default LLM settings (derived from DEFAULT_LLM_PROVIDER)
 */
export const DEFAULT_LLM_BASE_URL = DEFAULT_LLM_PROVIDER.baseUrl;
export const DEFAULT_LLM_MODEL = DEFAULT_LLM_PROVIDER.model;

/**
 * Default reader settings
 */
export const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: "Literata",
  fontSize: 16,
  lineHeight: 1.6,
  viewMode: "paginated",
  theme: "sepia",
  // Legacy fields (kept for migration)
  llmApiKey: "",
  llmBaseUrl: DEFAULT_LLM_BASE_URL,
  llmModel: DEFAULT_LLM_MODEL,
  llmTranslationApiKey: "",
  llmTranslationBaseUrl: DEFAULT_LLM_BASE_URL,
  llmTranslationModel: DEFAULT_LLM_MODEL,
  // New provider-based system
  llmProviders: [DEFAULT_LLM_PROVIDER],
  llmAssignments: DEFAULT_LLM_ASSIGNMENTS,
};

import type {
  ReaderSettings,
  Theme,
  LLMModelConfig,
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
 * Default LLM model configuration
 */
export const DEFAULT_LLM_MODELS: LLMModelConfig = {
  previewModel: "gpt-4o-mini",
  askModel: "gpt-4o-mini",
  translationModel: "gpt-4o-mini",
};

/**
 * Default reader settings
 */
export const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: "Literata",
  fontSize: 16,
  lineHeight: 1.6,
  viewMode: "paginated",
  theme: "sepia",
  llmProvider: {
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
  },
  llmModels: DEFAULT_LLM_MODELS,
};

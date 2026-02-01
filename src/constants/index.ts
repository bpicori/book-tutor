import type {
  ReaderSettings,
  Theme,
  LLMModelConfig,
  LLMProviderType,
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
 * Available LLM provider types with metadata
 */
export interface ProviderTypeInfo {
  type: LLMProviderType;
  label: string;
  description: string;
}

export const PROVIDER_TYPES: ProviderTypeInfo[] = [
  {
    type: "groq",
    label: "Groq",
    description: "Fast inference with free tier",
  },
  {
    type: "cerebras",
    label: "Cerebras",
    description: "High-speed inference with free tier",
  },
  {
    type: "openrouter",
    label: "OpenRouter",
    description: "Access to multiple models via unified API",
  },
  {
    type: "nvidia-nim",
    label: "NVIDIA NIM",
    description: "NVIDIA's inference microservices",
  },
];

/**
 * Default LLM model configuration
 */
export const DEFAULT_LLM_MODELS: LLMModelConfig = {
  previewModel: "llama-3.1-8b",
  askModel: "llama-3.1-8b",
  translationModel: "llama-3.1-8b",
};

/**
 * Common model suggestions for the UI
 */
export const SUGGESTED_MODELS = [
  { value: "llama-3.1-8b", label: "Llama 3.1 8B (Fast)" },
  { value: "llama-3.3-70b", label: "Llama 3.3 70B (Smart)" },
  { value: "llama-3.1-70b", label: "Llama 3.1 70B" },
  { value: "mixtral-8x7b", label: "Mixtral 8x7B" },
  { value: "gemma-7b", label: "Gemma 7B" },
];

/**
 * Default reader settings
 */
export const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: "Literata",
  fontSize: 16,
  lineHeight: 1.6,
  viewMode: "paginated",
  theme: "sepia",
  llmProviders: [],
  llmModels: DEFAULT_LLM_MODELS,
};

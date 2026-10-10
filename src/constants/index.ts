import type {
  ReaderSettings,
  HighlightColor,
  LLMModelConfig,
  SpeechProviderConfig,
} from "../types";

export { ROUTES, SETTINGS_TABS, isValidSettingsTabId } from "./routes";
export type { SettingsTabId } from "./routes";
export { THEME_PALETTE, THEMES } from "./themePalette";
export type { ThemePaletteEntry } from "./themePalette";

export const APP_NAME = "Book Tutor";
export const DEFAULT_LLM_BASE_URL = "https://api.openai.com/v1";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const DEFAULT_SPEECH_PROVIDER: SpeechProviderConfig = {
  type: "openrouter",
  baseUrl: OPENROUTER_BASE_URL,
  apiKey: "",
  model: "google/gemini-3.8-flash-lite-tts",
  voice: "Kore",
};

export const STORAGE_KEY = "read-with-ai-storage";
export const DB_NAME = "read-with-ai-books";
export const DB_VERSION = 1;
export const DB_STORE_NAME = "books";

/** IndexedDB database for synthesized read-aloud audio. */
export const SPEECH_CACHE_DB_NAME = "read-with-ai-speech";
export const SPEECH_CACHE_DB_VERSION = 1;
export const SPEECH_CACHE_META_STORE = "meta";
export const SPEECH_CACHE_AUDIO_STORE = "audio";
/** LRU byte budget for persisted speech audio (Gemini PCM WAV is ~2.9 MB/min). */
export const SPEECH_CACHE_MAX_BYTES = 128 * 1024 * 1024;

/**
 * Characters sent to the model in one request before a chapter is summarized
 * in chunks instead.
 *
 * Character counting is a rough proxy for tokens (~4 characters each), but it
 * avoids depending on a tokenizer. 200k characters is about 50k tokens, which
 * current long-context models accept comfortably. When this was 40k, ordinary
 * book chapters were being split and re-summarized needlessly.
 */
export const CHAPTER_CONTEXT_CHAR_BUDGET = 200_000;

/** Legacy chunk target; kept for callers that request a specific chunk count. */
export const CHAPTER_CHUNK_TARGET_CHARS = 40_000;
export const CHAPTER_SPLIT_SEARCH_WINDOW = 5_000;

/**
 * How much of the previous rolling summary is carried into the next chunk.
 * Without a cap the prompt grows with the chapter, which is what made long
 * chapters slow and expensive.
 */
export const ROLLING_SUMMARY_CONTEXT_CHARS = 4_000;

/** Characters of raw chapter text an Ask AI prompt may carry. */
export const CHAT_CONTEXT_CHAR_BUDGET = 32_000;

/** Characters of conversation history an Ask AI prompt may carry. */
export const CHAT_HISTORY_CHAR_BUDGET = 12_000;

/** Characters of earlier-chapter summaries an Ask AI prompt may carry. */
export const BOOK_MEMORY_CHAR_BUDGET = 12_000;

export const DEFAULT_LLM_MODELS: LLMModelConfig = {
  previewModel: "gpt-4o-mini",
  askModel: "gpt-4o-mini",
  translationModel: "gpt-4o-mini",
};

export interface HighlightColorInfo {
  id: HighlightColor;
  label: string;
  hex: string;
}

export const HIGHLIGHT_COLORS: HighlightColorInfo[] = [
  { id: "yellow", label: "Yellow", hex: "#FDE047" },
  { id: "green", label: "Green", hex: "#86EFAC" },
  { id: "blue", label: "Blue", hex: "#93C5FD" },
  { id: "pink", label: "Pink", hex: "#F9A8D4" },
];

export function getHighlightHex(color: HighlightColor): string {
  return HIGHLIGHT_COLORS.find((c) => c.id === color)?.hex ?? "#FDE047";
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: "Literata",
  fontSize: 16,
  lineHeight: 1.6,
  viewMode: "paginated",
  theme: "sepia",
  llmProvider: {
    baseUrl: DEFAULT_LLM_BASE_URL,
    apiKey: "",
  },
  llmModels: DEFAULT_LLM_MODELS,
  speechProvider: DEFAULT_SPEECH_PROVIDER,
};

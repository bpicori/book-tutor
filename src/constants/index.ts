import type { ReaderSettings, HighlightColor, LLMModelConfig } from "../types";

export { ROUTES, SETTINGS_TABS, isValidSettingsTabId } from "./routes";
export type { SettingsTabId } from "./routes";
export { THEME_PALETTE, THEMES } from "./themePalette";
export type { ThemePaletteEntry } from "./themePalette";

export const APP_NAME = "Book Tutor";
export const DEFAULT_LLM_BASE_URL = "https://api.openai.com/v1";

export const STORAGE_KEY = "read-with-ai-storage";
export const DB_NAME = "read-with-ai-books";
export const DB_VERSION = 1;
export const DB_STORE_NAME = "books";

export const CHAPTER_CHUNK_TARGET_CHARS = 40_000;
export const CHAPTER_SPLIT_SEARCH_WINDOW = 5_000;

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
};

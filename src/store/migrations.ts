import type {
  LibraryBook,
  ReaderFont,
  ReaderSettings,
  SavedWord,
  Theme,
} from "../types";
import {
  DEFAULT_LLM_BASE_URL,
  DEFAULT_LLM_MODELS,
  DEFAULT_SETTINGS,
  DEFAULT_SPEECH_PROVIDER,
  READER_FONTS,
} from "../constants";

const THEME_MAP: Record<string, Theme> = {
  paper: "paper",
  sepia: "sepia",
  solarized: "solarized",
  night: "night",
  nord: "night",
  dark: "night",
};

const FONT_MAP: Record<string, ReaderFont> = {
  iowan: "iowan",
  display: "iowan",
  literata: "iowan",
  georgia: "iowan",
  charter: "charter",
  merriweather: "charter",
  sans: "sans",
  "system sans": "sans",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function normalizeSettings(raw: unknown): ReaderSettings {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const rawFont = String(source.fontFamily ?? "").toLowerCase();
  const fontFamily: ReaderFont =
    FONT_MAP[rawFont] ?? DEFAULT_SETTINGS.fontFamily;

  const rawSize = Number(source.fontSize);
  const fontSize = Number.isFinite(rawSize)
    ? clamp(Math.round(rawSize * 2) / 2, 16, 24)
    : DEFAULT_SETTINGS.fontSize;

  const lineHeights = [1.55, 1.72, 1.9];
  const rawLeading = Number(source.lineHeight);
  const lineHeight = Number.isFinite(rawLeading)
    ? lineHeights.reduce((closest, current) =>
        Math.abs(current - rawLeading) < Math.abs(closest - rawLeading)
          ? current
          : closest
      )
    : DEFAULT_SETTINGS.lineHeight;

  const widths = [560, 620, 680];
  const rawWidth = Number(source.readingWidth);
  const readingWidth = widths.includes(rawWidth)
    ? rawWidth
    : DEFAULT_SETTINGS.readingWidth;

  const rawTheme = String(source.theme ?? "");
  const theme: Theme = THEME_MAP[rawTheme] ?? DEFAULT_SETTINGS.theme;

  const rawRate = Number(source.playbackRate);
  const playbackRate = Number.isFinite(rawRate)
    ? clamp(Math.round(rawRate * 100) / 100, 0.6, 1.6)
    : DEFAULT_SETTINGS.playbackRate;

  const llmProvider =
    source.llmProvider && typeof source.llmProvider === "object"
      ? (source.llmProvider as Record<string, unknown>)
      : {};
  const llmModels =
    source.llmModels && typeof source.llmModels === "object"
      ? (source.llmModels as Record<string, unknown>)
      : {};
  const speechProvider =
    source.speechProvider && typeof source.speechProvider === "object"
      ? (source.speechProvider as Record<string, unknown>)
      : {};
  const speechType = speechProvider.type;
  const speechTypeValid =
    speechType === "openai" ||
    speechType === "openrouter" ||
    speechType === "custom";

  return {
    fontFamily: READER_FONTS[fontFamily]
      ? fontFamily
      : DEFAULT_SETTINGS.fontFamily,
    fontSize,
    lineHeight,
    readingWidth,
    viewMode: source.viewMode === "scroll" ? "scroll" : "paginated",
    showProgress: source.showProgress !== false,
    reduceMotion: source.reduceMotion === true,
    carryBookMemory: source.carryBookMemory !== false,
    theme,
    llmProvider: {
      baseUrl: stringOr(llmProvider.baseUrl, DEFAULT_LLM_BASE_URL),
      apiKey: stringOr(llmProvider.apiKey, ""),
    },
    llmModels: {
      previewModel: stringOr(
        llmModels.previewModel,
        DEFAULT_LLM_MODELS.previewModel
      ),
      askModel: stringOr(llmModels.askModel, DEFAULT_LLM_MODELS.askModel),
      translationModel: stringOr(
        llmModels.translationModel,
        DEFAULT_LLM_MODELS.translationModel
      ),
    },
    speechProvider: {
      type: speechTypeValid ? speechType : DEFAULT_SPEECH_PROVIDER.type,
      baseUrl: stringOr(
        speechProvider.baseUrl,
        DEFAULT_SPEECH_PROVIDER.baseUrl
      ),
      apiKey: stringOr(speechProvider.apiKey, ""),
      model: stringOr(speechProvider.model, DEFAULT_SPEECH_PROVIDER.model),
      voice: stringOr(speechProvider.voice, DEFAULT_SPEECH_PROVIDER.voice),
    },
    playbackRate,
  };
}

export function normalizeWord(raw: unknown): SavedWord | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  if (typeof source.word !== "string" || !source.word.trim()) return null;
  if (typeof source.definition !== "string") return null;

  return {
    id: stringOr(source.id, crypto.randomUUID()),
    word: source.word.trim(),
    definition: source.definition,
    savedAt:
      typeof source.savedAt === "number" && Number.isFinite(source.savedAt)
        ? source.savedAt
        : Date.now(),
    bookId: typeof source.bookId === "string" ? source.bookId : undefined,
    bookTitle:
      typeof source.bookTitle === "string" ? source.bookTitle : undefined,
    known: source.known === true,
  };
}

export function normalizeLibraryBook(raw: unknown): LibraryBook | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  if (typeof source.id !== "string" || typeof source.title !== "string") {
    return null;
  }

  const rawProgress = Number(source.progress);
  const progress = Number.isFinite(rawProgress)
    ? clamp(rawProgress > 1 ? rawProgress / 100 : rawProgress, 0, 1)
    : 0;

  return {
    id: source.id,
    title: source.title,
    author: stringOr(source.author, "Unknown Author"),
    coverDataUrl:
      typeof source.coverDataUrl === "string" ? source.coverDataUrl : null,
    addedAt:
      typeof source.addedAt === "number" && Number.isFinite(source.addedAt)
        ? source.addedAt
        : Date.now(),
    lastReadAt:
      typeof source.lastReadAt === "number" &&
      Number.isFinite(source.lastReadAt)
        ? source.lastReadAt
        : null,
    progress,
    lastLocation:
      typeof source.lastLocation === "string" ? source.lastLocation : null,
    chapterScopeDepth:
      typeof source.chapterScopeDepth === "number"
        ? source.chapterScopeDepth
        : null,
  };
}

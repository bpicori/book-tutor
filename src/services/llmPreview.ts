import type { ChapterPreview, ChapterSummary } from "../types";
import {
  calculateOptimalChunks,
  splitChapterIntoChunks,
} from "../utils/chapterChunker";
import {
  CHAPTER_PREVIEW_SYSTEM_PROMPT,
  createChapterPreviewUserPrompt,
  createWordDefinitionPrompt,
} from "./prompts";
import {
  createClient,
  handleOpenAIError,
  LLMServiceError,
  type LLMSettings,
} from "./llmClient";
import { generateChapterSummaries } from "./llmSummaries";

interface PreviewResponse {
  themes: string[];
  keyConcepts: string[];
  toneAndStyle?: string;
  characters?: string[];
  definitions?: Array<{ term: string; definition: string }>;
  guidingQuestions: string[];
}

interface PreparedContent {
  content: string;
  summaries?: ChapterSummary[];
  fullSummary?: string;
  chunkingApplied: boolean;
}

async function prepareContentForPreview(
  chapterContent: string,
  settings: LLMSettings,
  onProgress?: (
    step: string,
    progress?: { current: number; total: number }
  ) => void
): Promise<PreparedContent> {
  const numChunks = calculateOptimalChunks(chapterContent.length);
  const needsChunking = numChunks > 1;

  if (needsChunking) {
    onProgress?.("Chunking chapter...");
    const chunks = splitChapterIntoChunks(chapterContent, numChunks);

    onProgress?.("Generating summaries...");
    const summaries = await generateChapterSummaries(
      chunks,
      settings,
      (current, total) => {
        onProgress?.("Generating summaries...", { current, total });
      }
    );

    const fullSummary =
      summaries[summaries.length - 1]?.summary || chapterContent;

    return {
      content: fullSummary,
      summaries,
      fullSummary,
      chunkingApplied: true,
    };
  }

  return {
    content: chapterContent,
    chunkingApplied: false,
  };
}

function validatePreviewResponse(
  parsed: PreviewResponse
): Omit<
  ChapterPreview,
  | "chapterHref"
  | "chapterLabel"
  | "generatedAt"
  | "summaries"
  | "fullSummary"
  | "chunkingApplied"
> {
  const ensureStringArray = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (typeof obj.term === "string") return obj.term;
          if (typeof obj.name === "string") return obj.name;
          if (typeof obj.value === "string") return obj.value;
        }
        return null;
      })
      .filter((item): item is string => item !== null && item.length > 0);
  };

  const themes = ensureStringArray(parsed.themes);
  const keyConcepts = ensureStringArray(parsed.keyConcepts);
  const guidingQuestions = ensureStringArray(parsed.guidingQuestions);
  const characters = parsed.characters
    ? ensureStringArray(parsed.characters)
    : undefined;

  let definitions: Array<{ term: string; definition: string }> | undefined;
  if (Array.isArray(parsed.definitions)) {
    definitions = parsed.definitions.filter(
      (def): def is { term: string; definition: string } =>
        def &&
        typeof def === "object" &&
        typeof def.term === "string" &&
        typeof def.definition === "string"
    );
    if (definitions.length === 0) definitions = undefined;
  }

  return {
    themes,
    keyConcepts,
    toneAndStyle: parsed.toneAndStyle,
    characters: characters && characters.length > 0 ? characters : undefined,
    definitions,
    guidingQuestions,
  };
}

export async function generateChapterPreview(
  bookTitle: string,
  bookAuthor: string,
  chapterLabel: string,
  chapterContent: string,
  settings: LLMSettings,
  onProgress?: (
    step: string,
    progress?: { current: number; total: number }
  ) => void
): Promise<
  Omit<ChapterPreview, "chapterHref" | "chapterLabel" | "generatedAt">
> {
  const client = createClient(settings);

  const preparedContent = await prepareContentForPreview(
    chapterContent,
    settings,
    onProgress
  );

  onProgress?.("Generating preview...");
  const userPrompt = createChapterPreviewUserPrompt(
    bookTitle,
    bookAuthor,
    chapterLabel,
    preparedContent.content
  );

  try {
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [
        { role: "system", content: CHAPTER_PREVIEW_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new LLMServiceError(
        "Empty response from AI. Please try again.",
        "EMPTY_RESPONSE"
      );
    }

    const parsed: PreviewResponse = JSON.parse(content);
    const validated = validatePreviewResponse(parsed);

    return {
      ...validated,
      summaries: preparedContent.summaries,
      fullSummary: preparedContent.fullSummary,
      chunkingApplied: preparedContent.chunkingApplied,
    };
  } catch (error) {
    if (error instanceof LLMServiceError) {
      throw error;
    }
    handleOpenAIError(error, settings);
  }
}

export async function getWordDefinition(
  word: string,
  settings: LLMSettings
): Promise<string> {
  const client = createClient(settings);
  const userPrompt = createWordDefinitionPrompt(word);

  try {
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: "system",
          content:
            "Dictionary assistant. Provide concise definitions and translations.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new LLMServiceError(
        "No response choices returned from AI. Please try again.",
        "EMPTY_RESPONSE"
      );
    }

    const choice = response.choices[0];
    const finishReason = choice?.finish_reason;

    if (finishReason === "length") {
      throw new LLMServiceError(
        "Response was cut off. Please try again.",
        "TRUNCATED_RESPONSE"
      );
    }
    if (finishReason === "content_filter") {
      throw new LLMServiceError(
        "Response was filtered. Please try again.",
        "FILTERED_RESPONSE"
      );
    }

    const message = choice?.message;
    if (!message) {
      throw new LLMServiceError(
        "No message in response. Please try again.",
        "EMPTY_RESPONSE"
      );
    }

    const content = message.content;
    if (!content || content.trim().length === 0) {
      const reasonMsg = finishReason ? ` (finish_reason: ${finishReason})` : "";
      throw new LLMServiceError(
        `Empty response from AI${reasonMsg}. Please try again.`,
        "EMPTY_RESPONSE"
      );
    }

    return content.trim();
  } catch (error) {
    if (error instanceof LLMServiceError) {
      throw error;
    }
    handleOpenAIError(error, settings);
  }
}

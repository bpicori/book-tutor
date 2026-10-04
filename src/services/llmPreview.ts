import type { ChapterPreview, ChapterSummary } from "../types";
import {
  calculateOptimalChunks,
  splitChapterIntoChunks,
} from "../utils/chapterChunker";
import { CHAPTER_CONTEXT_CHAR_BUDGET } from "../constants";
import {
  CHAPTER_PREVIEW_SYSTEM_PROMPT,
  createChapterPreviewUserPrompt,
  createChapterPreviewRetryPrompt,
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
  /** Text used for the preview request. */
  content: string;
  summaries?: ChapterSummary[];
  fullSummary?: string;
  chunkingApplied: boolean;
}

/**
 * Prepares chapter text for a preview request.
 *
 * Modern models accept whole chapters, so raw text is preferred and kept even
 * when the chapter has to be summarized first. Earlier versions replaced the
 * chapter with the last rolling summary, which meant the preview described a
 * summary instead of the chapter itself.
 */
async function prepareContentForPreview(
  chapterContent: string,
  settings: LLMSettings,
  onProgress?: (
    step: string,
    progress?: { current: number; total: number }
  ) => void
): Promise<PreparedContent> {
  const numChunks = calculateOptimalChunks(chapterContent.length);

  if (numChunks <= 1) {
    return {
      content: chapterContent,
      chunkingApplied: false,
    };
  }

  onProgress?.("Chunking chapter...");
  const chunks = splitChapterIntoChunks(chapterContent, numChunks);

  onProgress?.("Summarizing long chapter...");
  const summaries = await generateChapterSummaries(
    chunks,
    settings,
    (current, total) => {
      onProgress?.("Summarizing long chapter...", { current, total });
    }
  );

  const fullSummary = summaries.map((s) => s.summary).join("\n\n");

  return {
    content: buildOversizedChapterContext(chunks, fullSummary),
    summaries,
    fullSummary,
    chunkingApplied: true,
  };
}

/**
 * Context for a chapter that does not fit in one request: the opening section
 * verbatim, the running summary of the whole chapter, and the closing section
 * verbatim. Openings and endings carry the chapter's framing, and the summary
 * keeps the middle available without sending it twice.
 */
function buildOversizedChapterContext(
  chunks: ReturnType<typeof splitChapterIntoChunks>,
  fullSummary: string
): string {
  const perSectionBudget = Math.floor(CHAPTER_CONTEXT_CHAR_BUDGET / 3);
  const first = chunks[0]?.content ?? "";
  const last = chunks[chunks.length - 1]?.content ?? "";
  const firstPart = first.slice(0, perSectionBudget);
  const lastPart = chunks.length > 1 ? last.slice(-perSectionBudget) : "";

  const parts = [
    `OPENING OF THE CHAPTER (verbatim):\n---\n${firstPart}\n---`,
    `SUMMARY OF THE CHAPTER SO FAR:\n---\n${fullSummary}\n---`,
  ];

  if (lastPart) {
    parts.push(`CLOSING OF THE CHAPTER (verbatim):\n---\n${lastPart}\n---`);
  }

  return parts.join("\n\n");
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

/**
 * Reads a JSON object out of a model response.
 *
 * Models sometimes wrap JSON in a code fence or add a sentence around it even
 * when a JSON response format was requested, so the object is located rather
 * than assumed to be the whole message.
 */
export function parsePreviewJson(content: string): PreviewResponse {
  const attempts: string[] = [content.trim()];

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) attempts.push(fenced[1].trim());

  const braces = content.match(/\{[\s\S]*\}/);
  if (braces?.[0]) attempts.push(braces[0]);

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as PreviewResponse;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Try the next candidate.
    }
  }

  throw new LLMServiceError(
    "The AI reply was not valid JSON. Please try again.",
    "PARSE_ERROR"
  );
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

  const requestPreview = async (prompt: string): Promise<PreviewResponse> => {
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [
        { role: "system", content: CHAPTER_PREVIEW_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      // Structured extraction: a low temperature keeps the fields consistent.
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new LLMServiceError(
        "Empty response from AI. Please try again.",
        "EMPTY_RESPONSE"
      );
    }
    return parsePreviewJson(content);
  };

  try {
    let parsed: PreviewResponse;
    try {
      parsed = await requestPreview(userPrompt);
    } catch (error) {
      // One corrective retry, which usually fixes a malformed or truncated
      // JSON reply without making the reader click again.
      if (!(error instanceof LLMServiceError) || error.code !== "PARSE_ERROR") {
        throw error;
      }
      onProgress?.("Retrying preview...");
      parsed = await requestPreview(
        createChapterPreviewRetryPrompt(userPrompt, error.message)
      );
    }

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

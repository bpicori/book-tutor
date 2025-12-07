import OpenAI from "openai";
import type { ChatMessage, ChapterPreview } from "../types";
import {
  CHAPTER_PREVIEW_SYSTEM_PROMPT,
  createChapterPreviewUserPrompt,
  createChatSystemPrompt,
  createWordDefinitionPrompt,
} from "./prompts";

export interface LLMSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class LLMServiceError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "LLMServiceError";
    this.code = code;
  }
}

function createClient(settings: LLMSettings): OpenAI {
  if (!settings.apiKey) {
    throw new LLMServiceError(
      "API key is not configured. Please add your API key in Settings.",
      "NO_API_KEY"
    );
  }

  return new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl || "https://api.openai.com/v1",
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      "x-stainless-arch": null,
      "x-stainless-lang": null,
      "x-stainless-os": null,
      "x-stainless-package-version": null,
      "x-stainless-retry-count": null,
      "x-stainless-runtime": null,
      "x-stainless-runtime-version": null,
      "x-stainless-timeout": null,
    },
  });
}

/**
 * Centralized error handler for OpenAI API errors.
 * Converts OpenAI API errors into LLMServiceError with appropriate messages.
 */
function handleOpenAIError(error: unknown, settings: LLMSettings): never {
  if (error instanceof LLMServiceError) {
    throw error;
  }

  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      throw new LLMServiceError(
        "Invalid API key. Please check your API key in Settings.",
        "INVALID_API_KEY"
      );
    }
    if (error.status === 429) {
      throw new LLMServiceError(
        "Rate limit exceeded. Please try again later.",
        "RATE_LIMIT"
      );
    }
    if (error.status === 404) {
      throw new LLMServiceError(
        `Model "${settings.model}" not found. Please check your model name.`,
        "MODEL_NOT_FOUND"
      );
    }
    throw new LLMServiceError(
      error.message || "An error occurred while communicating with the API.",
      "API_ERROR"
    );
  }

  if (error instanceof SyntaxError) {
    throw new LLMServiceError(
      "Failed to parse AI response. Please try again.",
      "PARSE_ERROR"
    );
  }

  throw new LLMServiceError(
    "Failed to connect to the API. Please check your network connection.",
    "NETWORK_ERROR"
  );
}

export async function* streamChat(
  messages: ChatMessage[],
  settings: LLMSettings,
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  const client = createClient(settings);

  const formattedMessages: OpenAI.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    formattedMessages.push({ role: "system", content: systemPrompt });
  }

  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  try {
    const stream = await client.chat.completions.create({
      model: settings.model,
      messages: formattedMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    handleOpenAIError(error, settings);
  }
}

/**
 * Streams a chat conversation for a specific chapter with book context.
 * Automatically creates a system prompt with book and chapter information.
 * @param bookTitle - The title of the book
 * @param bookAuthor - The author of the book
 * @param chapterLabel - The label/name of the current chapter
 * @param chapterContent - The content of the current chapter
 * @param messages - The conversation history
 * @param settings - LLM configuration settings
 * @returns An async generator that yields streamed content chunks
 */
export async function* streamChapterChat(
  bookTitle: string,
  bookAuthor: string,
  chapterLabel: string,
  chapterContent: string,
  messages: ChatMessage[],
  settings: LLMSettings
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = createChatSystemPrompt(
    bookTitle,
    bookAuthor,
    chapterLabel,
    chapterContent
  );
  yield* streamChat(messages, settings, systemPrompt);
}

interface PreviewResponse {
  themes: string[];
  keyConcepts: string[];
  toneAndStyle?: string;
  characters?: string[];
  definitions?: Array<{ term: string; definition: string }>;
  guidingQuestions: string[];
}

export async function generateChapterPreview(
  bookTitle: string,
  bookAuthor: string,
  chapterLabel: string,
  chapterContent: string,
  settings: LLMSettings
): Promise<
  Omit<ChapterPreview, "chapterHref" | "chapterLabel" | "generatedAt">
> {
  const client = createClient(settings);

  // Truncate chapter content if too long (aim for ~8000 tokens max, roughly 32000 chars)
  const maxContentLength = 32000;
  const truncatedContent =
    chapterContent.length > maxContentLength
      ? chapterContent.slice(0, maxContentLength) +
        "\n\n[Content truncated for length...]"
      : chapterContent;

  const userPrompt = createChapterPreviewUserPrompt(
    bookTitle,
    bookAuthor,
    chapterLabel,
    truncatedContent
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

    // Validate required fields
    if (!parsed.themes || !Array.isArray(parsed.themes)) {
      parsed.themes = [];
    }
    if (!parsed.keyConcepts || !Array.isArray(parsed.keyConcepts)) {
      parsed.keyConcepts = [];
    }
    if (!parsed.guidingQuestions || !Array.isArray(parsed.guidingQuestions)) {
      parsed.guidingQuestions = [];
    }

    return {
      themes: parsed.themes,
      keyConcepts: parsed.keyConcepts,
      toneAndStyle: parsed.toneAndStyle,
      characters: parsed.characters,
      definitions: parsed.definitions,
      guidingQuestions: parsed.guidingQuestions,
    };
  } catch (error) {
    if (error instanceof LLMServiceError) {
      throw error;
    }
    handleOpenAIError(error, settings);
  }
}

/**
 * Gets a word definition or translation using the LLM.
 * Returns a concise definition/translation of the word or phrase.
 * @param word - The word or phrase to define/translate
 * @param settings - LLM configuration settings
 * @returns The definition/translation text
 */
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

    // Check if response has choices
    if (!response.choices || response.choices.length === 0) {
      throw new LLMServiceError(
        "No response choices returned from AI. Please try again.",
        "EMPTY_RESPONSE"
      );
    }

    const choice = response.choices[0];
    const finishReason = choice?.finish_reason;

    // Check finish reason - if it's "length" or "content_filter", we might have an issue
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
      // If finish reason is stop but content is empty, this is unusual
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

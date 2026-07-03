import OpenAI from "openai";
import { DEFAULT_LLM_BASE_URL } from "../constants";

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

export function formatLLMError(error: unknown): string {
  if (error instanceof LLMServiceError) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

export function createClient(settings: LLMSettings): OpenAI {
  if (!settings.apiKey) {
    throw new LLMServiceError(
      "API key is not configured. Please add your API key in Settings.",
      "NO_API_KEY"
    );
  }

  return new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl || DEFAULT_LLM_BASE_URL,
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

export function handleOpenAIError(
  error: unknown,
  settings: LLMSettings
): never {
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

  console.error("Unknown LLM error:", error);

  throw new LLMServiceError(
    "Failed to connect to the API. Please check your network connection.",
    "NETWORK_ERROR"
  );
}

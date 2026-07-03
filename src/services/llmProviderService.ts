import { DEFAULT_LLM_BASE_URL } from "../constants";
import type { LLMProviderConfig } from "../types";

export interface ModelInfo {
  id: string;
  owned_by?: string;
}

export interface ModelsResponse {
  data: ModelInfo[];
}

/**
 * Get the base URL for a provider.
 */
export const getProviderBaseUrl = (config: LLMProviderConfig): string => {
  return config.baseUrl || DEFAULT_LLM_BASE_URL;
};

/**
 * Fetch available models from the OpenAI-compatible API.
 */
export async function fetchModels(
  config: LLMProviderConfig
): Promise<string[]> {
  if (!config.apiKey || config.apiKey.trim() === "") {
    return [];
  }

  const baseUrl = getProviderBaseUrl(config);

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data: ModelsResponse = await response.json();

    // Sort models by ID for consistent ordering
    return data.data
      .map((model) => model.id)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("[LLM] Failed to fetch models:", error);
    return [];
  }
}

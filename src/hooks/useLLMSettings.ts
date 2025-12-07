import { useMemo } from "react";
import { useStore } from "../store/useStore";
import type { LLMSettings } from "../services/llmService";

/**
 * Hook to get LLM settings from the store in the format expected by LLMService
 * Uses the main model (for preview and Ask AI)
 */
export function useLLMSettings(): LLMSettings | null {
  const settings = useStore((state) => state.settings);

  return useMemo(() => {
    if (!settings.llmApiKey) {
      return null;
    }

    return {
      apiKey: settings.llmApiKey,
      baseUrl: settings.llmBaseUrl,
      model: settings.llmModel,
    };
  }, [settings.llmApiKey, settings.llmBaseUrl, settings.llmModel]);
}

/**
 * Hook to get LLM settings for translation
 * Uses translation-specific API key, base URL, and model
 * Falls back to main settings if translation settings are not configured
 */
export function useLLMTranslationSettings(): LLMSettings | null {
  const settings = useStore((state) => state.settings);

  return useMemo(() => {
    // Use translation API key if provided, otherwise fall back to main API key
    const apiKey = settings.llmTranslationApiKey || settings.llmApiKey;
    if (!apiKey) {
      return null;
    }

    // Use translation base URL if provided, otherwise fall back to main base URL
    const baseUrl = settings.llmTranslationBaseUrl || settings.llmBaseUrl;

    return {
      apiKey,
      baseUrl,
      model: settings.llmTranslationModel,
    };
  }, [
    settings.llmApiKey,
    settings.llmBaseUrl,
    settings.llmTranslationApiKey,
    settings.llmTranslationBaseUrl,
    settings.llmTranslationModel,
  ]);
}

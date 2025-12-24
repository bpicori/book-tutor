import { useMemo } from "react";
import { useStore } from "../store/useStore";
import type { LLMSettings as LLMServiceSettings } from "../services/llmService";

/**
 * Hook to get LLM settings from the store in the format expected by LLMService
 * Uses the provider assigned for preview
 */
export function useLLMSettings(): LLMServiceSettings | null {
  const settings = useStore((state) => state.settings);

  return useMemo(() => {
    const providerId = settings.llmAssignments.previewProvider;
    if (!providerId) {
      // Fallback to legacy settings for backward compatibility
      if (settings.llmApiKey) {
        return {
          apiKey: settings.llmApiKey,
          baseUrl: settings.llmBaseUrl,
          model: settings.llmModel,
        };
      }
      return null;
    }

    const provider = settings.llmProviders.find((p) => p.id === providerId);
    if (!provider || !provider.apiKey) {
      return null;
    }

    return {
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      model: provider.model,
    };
  }, [
    settings.llmProviders,
    settings.llmAssignments.previewProvider,
    // Legacy fallback
    settings.llmApiKey,
    settings.llmBaseUrl,
    settings.llmModel,
  ]);
}

/**
 * Hook to get LLM settings for Ask AI chat
 * Uses the provider assigned for ask, falls back to preview provider
 */
export function useLLMAskSettings(): LLMServiceSettings | null {
  const settings = useStore((state) => state.settings);

  return useMemo(() => {
    const providerId = settings.llmAssignments.askProvider || settings.llmAssignments.previewProvider;
    if (!providerId) {
      // Fallback to legacy settings for backward compatibility
      if (settings.llmApiKey) {
        return {
          apiKey: settings.llmApiKey,
          baseUrl: settings.llmBaseUrl,
          model: settings.llmModel,
        };
      }
      return null;
    }

    const provider = settings.llmProviders.find((p) => p.id === providerId);
    if (!provider || !provider.apiKey) {
      return null;
    }

    return {
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      model: provider.model,
    };
  }, [
    settings.llmProviders,
    settings.llmAssignments.askProvider,
    settings.llmAssignments.previewProvider,
    // Legacy fallback
    settings.llmApiKey,
    settings.llmBaseUrl,
    settings.llmModel,
  ]);
}

/**
 * Hook to get LLM settings for translation
 * Uses the provider assigned for translation
 */
export function useLLMTranslationSettings(): LLMServiceSettings | null {
  const settings = useStore((state) => state.settings);

  return useMemo(() => {
    const providerId = settings.llmAssignments.translationProvider;
    if (!providerId) {
      // Fallback to legacy translation settings or main settings
      const apiKey = settings.llmTranslationApiKey || settings.llmApiKey;
      if (!apiKey) {
        return null;
      }
      return {
        apiKey,
        baseUrl: settings.llmTranslationBaseUrl || settings.llmBaseUrl,
        model: settings.llmTranslationModel || settings.llmModel,
      };
    }

    const provider = settings.llmProviders.find((p) => p.id === providerId);
    if (!provider || !provider.apiKey) {
      return null;
    }

    return {
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      model: provider.model,
    };
  }, [
    settings.llmProviders,
    settings.llmAssignments.translationProvider,
    // Legacy fallback
    settings.llmTranslationApiKey,
    settings.llmTranslationBaseUrl,
    settings.llmTranslationModel,
    settings.llmApiKey,
    settings.llmBaseUrl,
    settings.llmModel,
  ]);
}

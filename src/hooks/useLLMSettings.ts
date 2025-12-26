import { useMemo } from "react";
import { useStore } from "../store/useStore";
import type { LLMSettings as LLMServiceSettings } from "../services/llmService";

type LLMUseCase = "preview" | "ask" | "translation";

/**
 * Generic hook to get LLM settings for a specific use case.
 * Handles provider lookup and fallbacks.
 */
function useLLMSettingsFor(useCase: LLMUseCase): LLMServiceSettings | null {
  const settings = useStore((state) => state.settings);

  return useMemo(() => {
    // Determine which provider ID to use based on use case
    let providerId: string | null = null;

    switch (useCase) {
      case "preview":
        providerId = settings.llmAssignments.previewProvider;
        break;
      case "ask":
        providerId =
          settings.llmAssignments.askProvider ||
          settings.llmAssignments.previewProvider;
        break;
      case "translation":
        providerId = settings.llmAssignments.translationProvider;
        break;
    }

    // Find provider from provider system
    if (providerId) {
      const provider = settings.llmProviders.find((p) => p.id === providerId);
      if (provider && provider.apiKey) {
        return {
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: provider.model,
        };
      }
    }

    return null;
  }, [
    useCase,
    settings.llmProviders,
    settings.llmAssignments.previewProvider,
    settings.llmAssignments.askProvider,
    settings.llmAssignments.translationProvider,
  ]);
}

/**
 * Hook to get LLM settings from the store in the format expected by LLMService
 * Uses the provider assigned for preview
 */
export function useLLMSettings(): LLMServiceSettings | null {
  return useLLMSettingsFor("preview");
}

/**
 * Hook to get LLM settings for Ask AI chat
 * Uses the provider assigned for ask, falls back to preview provider
 */
export function useLLMAskSettings(): LLMServiceSettings | null {
  return useLLMSettingsFor("ask");
}

/**
 * Hook to get LLM settings for translation
 * Uses the provider assigned for translation
 */
export function useLLMTranslationSettings(): LLMServiceSettings | null {
  return useLLMSettingsFor("translation");
}

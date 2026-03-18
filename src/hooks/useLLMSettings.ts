import { useMemo } from "react";
import { useStore } from "../store/useStore";
import type { LLMSettings as LLMServiceSettings } from "../services/llmService";
import { getProviderBaseUrl } from "../services/routerService";
import { DEFAULT_LLM_MODELS } from "../constants";

type LLMUseCase = "preview" | "ask" | "translation";

/**
 * Generic hook to get LLM settings for a specific use case.
 * Returns settings with API key, base URL, and model for the use case.
 */
function useLLMSettingsFor(useCase: LLMUseCase): LLMServiceSettings | null {
  const settings = useStore((state) => state.settings);

  return useMemo(() => {
    const models = settings.llmModels || DEFAULT_LLM_MODELS;
    const provider = settings.llmProvider;

    // Check if provider has an API key
    if (!provider?.apiKey || provider.apiKey.trim() === "") {
      return null;
    }

    // Determine which model to use based on use case
    let model: string;
    switch (useCase) {
      case "preview":
        model = models.previewModel;
        break;
      case "ask":
        model = models.askModel || models.previewModel;
        break;
      case "translation":
        model = models.translationModel;
        break;
    }

    // Get the base URL for the provider
    const baseUrl = getProviderBaseUrl(provider);

    return {
      apiKey: provider.apiKey,
      baseUrl,
      model,
    };
  }, [settings.llmProvider, settings.llmModels]);
}

/**
 * Hook to get LLM settings from the store in the format expected by LLMService
 * Uses the model configured for preview
 */
export function useLLMSettings(): LLMServiceSettings | null {
  return useLLMSettingsFor("preview");
}

/**
 * Hook to get LLM settings for Ask AI chat
 * Uses the model configured for ask
 */
export function useLLMAskSettings(): LLMServiceSettings | null {
  return useLLMSettingsFor("ask");
}

/**
 * Hook to get LLM settings for translation
 * Uses the model configured for translation
 */
export function useLLMTranslationSettings(): LLMServiceSettings | null {
  return useLLMSettingsFor("translation");
}

/**
 * @deprecated Router initialization is no longer needed with single provider.
 * This hook is kept for backward compatibility but does nothing.
 */
export function useRouterInitialization(): void {
  // No-op - router initialization not needed with single provider
}

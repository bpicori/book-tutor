import { useMemo, useEffect } from "react";
import { useStore } from "../store/useStore";
import type { LLMSettings as LLMServiceSettings } from "../services/llmService";
import {
  initializeRouter,
  isRouterAvailable,
  normalizeProviders,
} from "../services/routerService";
import { DEFAULT_LLM_MODELS } from "../constants";

type LLMUseCase = "preview" | "ask" | "translation";

/**
 * Generic hook to get LLM settings for a specific use case.
 * With the router, we just return the model for the use case.
 * The router handles provider selection automatically.
 */
function useLLMSettingsFor(useCase: LLMUseCase): LLMServiceSettings | null {
  const settings = useStore((state) => state.settings);

  return useMemo(() => {
    const models = settings.llmModels || DEFAULT_LLM_MODELS;
    const rawProviders = settings.llmProviders || [];

    // Normalize providers with defaults for backward compatibility
    const providers = normalizeProviders(rawProviders);

    // Check if we have any enabled providers with API keys
    const hasValidProvider = providers.some(
      (p) => p.enabled && p.apiKey && p.apiKey.trim() !== ""
    );

    if (!hasValidProvider) {
      return null;
    }

    // Router must be available if we have valid providers
    // (router is initialized in useRouterInitialization)
    if (!isRouterAvailable()) {
      // Router not yet initialized - this can happen during initial render
      // Return null and the UI will retry once router is ready
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

    // Router handles all provider/API key management
    // We just need to pass the model
    return {
      apiKey: "", // Router handles this internally
      baseUrl: "", // Router handles this internally
      model,
    };
  }, [settings.llmProviders, settings.llmModels]);
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
 * Hook to initialize the free-tier-router when providers are configured.
 * Should be called once at the app level (e.g., in App.tsx).
 *
 * The router provides automatic failover between providers when one hits rate limits.
 */
export function useRouterInitialization(): void {
  const llmProviders = useStore((state) => state.settings.llmProviders);

  useEffect(() => {
    // Initialize router with current providers
    initializeRouter(llmProviders);
  }, [llmProviders]);
}

import type {
  ReaderSettings,
  LLMProvider,
  LLMProviderAssignments,
} from "../../types";

export interface MigrationResult {
  llmProviders: LLMProvider[];
  llmAssignments: LLMProviderAssignments;
}

/**
 * Migrates legacy LLM settings to the new provider-based system.
 * Handles conversion from flat settings to provider/assignment structure.
 */
export function migrateLLMSettings(
  persistedSettings: Partial<ReaderSettings>,
  defaults: {
    provider: LLMProvider;
    assignments: LLMProviderAssignments;
  }
): MigrationResult {
  const persisted = persistedSettings || {};
  const persistedSettingsTyped = persisted as Partial<ReaderSettings>;

  // Check if we need to migrate from old format
  if (
    !persistedSettingsTyped.llmProviders ||
    !Array.isArray(persistedSettingsTyped.llmProviders) ||
    persistedSettingsTyped.llmProviders.length === 0
  ) {
    // Migration needed: create providers from old flat settings
    const providers: LLMProvider[] = [];
    const assignments: LLMProviderAssignments = {
      previewProvider: null,
      askProvider: null,
      translationProvider: null,
    };

    // Create main provider from old settings
    if (
      persistedSettingsTyped.llmApiKey ||
      persistedSettingsTyped.llmBaseUrl ||
      persistedSettingsTyped.llmModel
    ) {
      const mainProvider: LLMProvider = {
        id: "main",
        name: "Main",
        apiKey: persistedSettingsTyped.llmApiKey || "",
        baseUrl: persistedSettingsTyped.llmBaseUrl || defaults.provider.baseUrl,
        model: persistedSettingsTyped.llmModel || defaults.provider.model,
      };
      providers.push(mainProvider);
      assignments.previewProvider = "main";
      assignments.askProvider = "main";
    }

    // Create translation provider if different from main
    const hasTranslationSettings =
      persistedSettingsTyped.llmTranslationApiKey ||
      persistedSettingsTyped.llmTranslationBaseUrl ||
      persistedSettingsTyped.llmTranslationModel;

    if (hasTranslationSettings) {
      const translationProvider: LLMProvider = {
        id: "translation",
        name: "Translation",
        apiKey:
          persistedSettingsTyped.llmTranslationApiKey ||
          persistedSettingsTyped.llmApiKey ||
          "",
        baseUrl:
          persistedSettingsTyped.llmTranslationBaseUrl ||
          persistedSettingsTyped.llmBaseUrl ||
          defaults.provider.baseUrl,
        model:
          persistedSettingsTyped.llmTranslationModel ||
          persistedSettingsTyped.llmModel ||
          defaults.provider.model,
      };
      providers.push(translationProvider);
      assignments.translationProvider = "translation";
    } else if (providers.length > 0) {
      // Use main provider for translation if no separate translation settings
      assignments.translationProvider = "main";
    }

    // If no providers were created, use default
    if (providers.length === 0) {
      providers.push(defaults.provider);
    }

    return {
      llmProviders: providers,
      llmAssignments: assignments,
    };
  }

  // Use persisted providers and assignments if they exist
  let migratedProviders: LLMProvider[] = defaults.provider
    ? [defaults.provider]
    : [];
  let migratedAssignments: LLMProviderAssignments = defaults.assignments;

  if (Array.isArray(persistedSettingsTyped.llmProviders)) {
    migratedProviders = persistedSettingsTyped.llmProviders;
  }
  if (
    persistedSettingsTyped.llmAssignments &&
    typeof persistedSettingsTyped.llmAssignments === "object" &&
    "previewProvider" in persistedSettingsTyped.llmAssignments
  ) {
    migratedAssignments = persistedSettingsTyped.llmAssignments;
  }

  return {
    llmProviders: migratedProviders,
    llmAssignments: migratedAssignments,
  };
}

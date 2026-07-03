import { memo, useState, useCallback } from "react";
import type { LLMModelConfig, LLMProviderConfig } from "../../../types";
import { fetchModels } from "../../../services/llmProviderService";
import { Button } from "../../common";
import { ModelField } from "../ModelField";
import { StatusBanner } from "../StatusBanner";

interface ModelConfigProps {
  provider: LLMProviderConfig;
  models: LLMModelConfig;
  onModelChange: (updates: Partial<LLMModelConfig>) => void;
}

export const ModelConfig = memo(function ModelConfig({
  provider,
  models,
  onModelChange,
}: ModelConfigProps) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadModels = useCallback(async () => {
    if (!provider.apiKey || provider.apiKey.trim() === "") {
      setError("Enter an API key to fetch available models");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const modelIds = await fetchModels(provider);
      if (modelIds.length === 0) {
        setError("No models found. Check your API key and base URL.");
      } else {
        setError(null);
      }
      setAvailableModels(modelIds);
      setHasLoaded(true);
    } catch {
      setError("Failed to fetch models. Check your API key and base URL.");
      setAvailableModels([]);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  const canLoad = provider.apiKey && provider.apiKey.trim() !== "";

  return (
    <div className="border-t border-border-warm pt-6">
      <h3 className="text-lg font-semibold text-muted-gray-text mb-4">
        Model Configuration
      </h3>

      <p className="text-sm text-light-gray-text mb-4">
        Choose which model to use for each feature. Click "Load Models" to fetch
        available models from your provider, or enter model IDs manually.
      </p>

      <div className="mb-6">
        <Button
          variant="primary"
          onClick={handleLoadModels}
          disabled={isLoading || !canLoad}
          icon={isLoading ? "sync" : "refresh"}
          className={isLoading ? "animate-spin" : ""}
        >
          {isLoading
            ? "Loading..."
            : hasLoaded
              ? "Reload Models"
              : "Load Models"}
        </Button>
        {!canLoad && (
          <p className="mt-2 text-xs text-light-gray-text">
            Enter an API key above to load available models
          </p>
        )}
      </div>

      {error && (
        <StatusBanner variant="warning" className="mb-4">
          {error}
        </StatusBanner>
      )}

      <div className="space-y-6">
        <ModelField
          label="Chapter Preview Model"
          description="Used for generating chapter previews and summaries."
          value={models.previewModel}
          availableModels={availableModels}
          onChange={(value) => onModelChange({ previewModel: value })}
        />
        <ModelField
          label="Ask AI Chat Model"
          description="Used for Ask AI chat conversations about the book."
          value={models.askModel}
          availableModels={availableModels}
          onChange={(value) => onModelChange({ askModel: value })}
        />
        <ModelField
          label="Translation Model"
          description="Used for word translations and definitions."
          value={models.translationModel}
          availableModels={availableModels}
          onChange={(value) => onModelChange({ translationModel: value })}
        />
      </div>
    </div>
  );
});

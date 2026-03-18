import { memo, useState, useCallback } from "react";
import type { LLMModelConfig, LLMProviderConfig } from "../../../types";
import { fetchModels } from "../../../services/routerService";
import { Button } from "../../common";

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

  const hasModels = availableModels.length > 0;
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
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-3">
            Chapter Preview Model
          </label>
          {hasModels ? (
            <select
              value={models.previewModel}
              onChange={(e) => onModelChange({ previewModel: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={models.previewModel}
              onChange={(e) => onModelChange({ previewModel: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="Enter model ID (e.g., gpt-4o-mini)"
            />
          )}
          <p className="mt-2 text-xs text-light-gray-text">
            Used for generating chapter previews and summaries.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-3">
            Ask AI Chat Model
          </label>
          {hasModels ? (
            <select
              value={models.askModel}
              onChange={(e) => onModelChange({ askModel: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={models.askModel}
              onChange={(e) => onModelChange({ askModel: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="Enter model ID (e.g., gpt-4o-mini)"
            />
          )}
          <p className="mt-2 text-xs text-light-gray-text">
            Used for Ask AI chat conversations about the book.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-3">
            Translation Model
          </label>
          {hasModels ? (
            <select
              value={models.translationModel}
              onChange={(e) =>
                onModelChange({ translationModel: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={models.translationModel}
              onChange={(e) =>
                onModelChange({ translationModel: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="Enter model ID (e.g., gpt-4o-mini)"
            />
          )}
          <p className="mt-2 text-xs text-light-gray-text">
            Used for word translations and definitions.
          </p>
        </div>
      </div>
    </div>
  );
});

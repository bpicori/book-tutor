import { memo } from "react";
import type { LLMModelConfig } from "../../../types";
import { SUGGESTED_MODELS } from "../../../constants";

interface ModelConfigProps {
  models: LLMModelConfig;
  onModelChange: (updates: Partial<LLMModelConfig>) => void;
}

export const ModelConfig = memo(function ModelConfig({
  models,
  onModelChange,
}: ModelConfigProps) {
  return (
    <div className="border-t border-border-warm pt-6">
      <h3 className="text-lg font-semibold text-muted-gray-text mb-4">
        Model Configuration
      </h3>
      <p className="text-sm text-light-gray-text mb-6">
        Choose which model to use for each feature. The router will
        automatically select the best available provider.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-3">
            Chapter Preview Model
          </label>
          <input
            type="text"
            list="preview-models"
            value={models.previewModel}
            onChange={(e) => onModelChange({ previewModel: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
            placeholder="llama-3.1-8b"
          />
          <datalist id="preview-models">
            {SUGGESTED_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </datalist>
          <p className="mt-2 text-xs text-light-gray-text">
            Used for generating chapter previews and summaries.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-3">
            Ask AI Chat Model
          </label>
          <input
            type="text"
            list="ask-models"
            value={models.askModel}
            onChange={(e) => onModelChange({ askModel: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
            placeholder="llama-3.1-8b"
          />
          <datalist id="ask-models">
            {SUGGESTED_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </datalist>
          <p className="mt-2 text-xs text-light-gray-text">
            Used for Ask AI chat conversations about the book.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-3">
            Translation Model
          </label>
          <input
            type="text"
            list="translation-models"
            value={models.translationModel}
            onChange={(e) =>
              onModelChange({ translationModel: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
            placeholder="llama-3.1-8b"
          />
          <datalist id="translation-models">
            {SUGGESTED_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </datalist>
          <p className="mt-2 text-xs text-light-gray-text">
            Used for word translations and definitions.
          </p>
        </div>
      </div>
    </div>
  );
});

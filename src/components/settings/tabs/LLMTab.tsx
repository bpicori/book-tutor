import { memo, useState } from "react";
import type { ReaderSettings } from "../../../types";
import { Button } from "../../common";

interface LLMTabProps {
  settings: ReaderSettings;
  onUpdate: (settings: Partial<ReaderSettings>) => void;
}

const commonModels = [
  { value: "openai/gpt-5.1", label: "GPT-5.1" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { value: "anthropic/claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
];

export const LLMTab = memo(function LLMTab({
  settings,
  onUpdate,
}: LLMTabProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showTranslationApiKey, setShowTranslationApiKey] = useState(false);

  return (
    <div className="space-y-8">
      {/* Preview & Ask AI Section */}
      <div>
        <h3 className="text-lg font-semibold text-muted-gray-text mb-4">
          Preview & Ask AI
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-3">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={settings.llmApiKey}
                onChange={(e) => onUpdate({ llmApiKey: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent pr-12"
                placeholder="sk-..."
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                icon={showApiKey ? "visibility_off" : "visibility"}
                className="absolute inset-y-0 right-0 w-12 h-full rounded-l-none hover:text-forest-green"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              />
            </div>
            <p className="mt-2 text-xs text-light-gray-text">
              Your API key is stored locally and never shared.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-3">
              Base URL
            </label>
            <input
              type="url"
              value={settings.llmBaseUrl}
              onChange={(e) => onUpdate({ llmBaseUrl: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="https://api.openai.com/v1"
            />
            <p className="mt-2 text-xs text-light-gray-text">
              Base URL for the OpenAI-compatible API endpoint.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-3">
              Model
            </label>
            <input
              type="text"
              list="llm-models"
              value={settings.llmModel}
              onChange={(e) => onUpdate({ llmModel: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="gpt-4o-mini"
            />
            <datalist id="llm-models">
              {commonModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </datalist>
            <p className="mt-2 text-xs text-light-gray-text">
              Model used for chapter previews and Ask AI chat.
            </p>
          </div>
        </div>
      </div>

      {/* Translation Section */}
      <div className="border-t border-border-warm pt-6">
        <h3 className="text-lg font-semibold text-muted-gray-text mb-4">
          Translation
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-3">
              API Key
            </label>
            <div className="relative">
              <input
                type={showTranslationApiKey ? "text" : "password"}
                value={settings.llmTranslationApiKey}
                onChange={(e) =>
                  onUpdate({ llmTranslationApiKey: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent pr-12"
                placeholder="sk-..."
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowTranslationApiKey(!showTranslationApiKey)}
                icon={showTranslationApiKey ? "visibility_off" : "visibility"}
                className="absolute inset-y-0 right-0 w-12 h-full rounded-l-none hover:text-forest-green"
                aria-label={
                  showTranslationApiKey ? "Hide API key" : "Show API key"
                }
              />
            </div>
            <p className="mt-2 text-xs text-light-gray-text">
              API key for translation service. Leave empty to use Preview & Ask
              AI settings.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-3">
              Base URL
            </label>
            <input
              type="url"
              value={settings.llmTranslationBaseUrl}
              onChange={(e) =>
                onUpdate({ llmTranslationBaseUrl: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="https://api.openai.com/v1"
            />
            <p className="mt-2 text-xs text-light-gray-text">
              Base URL for the translation API endpoint. Leave empty to use
              Preview & Ask AI settings.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-3">
              Model
            </label>
            <input
              type="text"
              list="llm-translation-models"
              value={settings.llmTranslationModel}
              onChange={(e) =>
                onUpdate({ llmTranslationModel: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="gpt-4o-mini"
            />
            <datalist id="llm-translation-models">
              {commonModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </datalist>
            <p className="mt-2 text-xs text-light-gray-text">
              Model used for word translations and definitions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

import { memo, useState } from "react";
import type {
  ReaderSettings,
  LLMProviderConfig,
  LLMModelConfig,
} from "../../../types";
import { Button } from "../../common";
import { ModelConfig } from "./ModelConfig";

interface LLMTabProps {
  settings: ReaderSettings;
  onUpdate: (settings: Partial<ReaderSettings>) => void;
}

export const LLMTab = memo(function LLMTab({ settings, onUpdate }: LLMTabProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const provider = settings.llmProvider;
  const models = settings.llmModels;

  const handleProviderUpdate = (updates: Partial<LLMProviderConfig>) => {
    onUpdate({
      llmProvider: {
        ...provider,
        ...updates,
      },
    });
  };

  const handleModelChange = (updates: Partial<LLMModelConfig>) => {
    onUpdate({
      llmModels: {
        ...models,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Provider Configuration Section */}
      <div>
        <h3 className="text-lg font-semibold text-muted-gray-text mb-4">
          LLM Provider
        </h3>
        <p className="text-sm text-light-gray-text mb-6">
          Configure your OpenAI-compatible API endpoint. Works with OpenAI,
          Groq, Cerebras, OpenRouter, local LLMs, and any OpenAI-compatible API.
        </p>

        <div className="border rounded-lg p-4 border-border-warm bg-warm-off-white">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-gray-text mb-2">
                Base URL
              </label>
              <input
                type="text"
                value={provider.baseUrl}
                onChange={(e) =>
                  handleProviderUpdate({ baseUrl: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
                placeholder="https://api.openai.com/v1"
              />
              <p className="mt-1 text-xs text-light-gray-text">
                The base URL for your OpenAI-compatible API endpoint
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-gray-text mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={provider.apiKey}
                  onChange={(e) =>
                    handleProviderUpdate({ apiKey: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent pr-12"
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
            </div>
          </div>
        </div>
      </div>

      {/* Model Configuration Section */}
      <ModelConfig
        provider={provider}
        models={models}
        onModelChange={handleModelChange}
      />
    </div>
  );
});

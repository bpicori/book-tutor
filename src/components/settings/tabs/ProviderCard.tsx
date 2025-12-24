import { memo } from "react";
import type { LLMProvider } from "../../../types";
import { Button } from "../../common";

interface ProviderCardProps {
  provider: LLMProvider;
  isEditing: boolean;
  showApiKey: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleShowApiKey: () => void;
  onUpdate: (updates: Partial<LLMProvider>) => void;
  onSave: () => void;
}

export const ProviderCard = memo(function ProviderCard({
  provider,
  isEditing,
  showApiKey,
  onEdit,
  onDelete,
  onToggleShowApiKey,
  onUpdate,
  onSave,
}: ProviderCardProps) {
  const commonModels = [
    { value: "openai/gpt-5.1", label: "GPT-5.1" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
    {
      value: "anthropic/claude-sonnet-4-5-20250929",
      label: "Claude Sonnet 4.5",
    },
  ];

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 border-forest-green bg-warm-off-white">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-2">
              Name
            </label>
            <input
              type="text"
              value={provider.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="My OpenAI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={provider.apiKey}
                onChange={(e) => onUpdate({ apiKey: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent pr-12"
                placeholder="sk-..."
              />
              <Button
                variant="ghost"
                type="button"
                onClick={onToggleShowApiKey}
                icon={showApiKey ? "visibility_off" : "visibility"}
                className="absolute inset-y-0 right-0 w-12 h-full rounded-l-none hover:text-forest-green"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-2">
              Base URL
            </label>
            <input
              type="url"
              value={provider.baseUrl}
              onChange={(e) => onUpdate({ baseUrl: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-2">
              Model
            </label>
            <input
              type="text"
              list={`llm-models-${provider.id}`}
              value={provider.model}
              onChange={(e) => onUpdate({ model: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              placeholder="gpt-4o-mini"
            />
            <datalist id={`llm-models-${provider.id}`}>
              {commonModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </datalist>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" onClick={onSave}>
              Save
            </Button>
            <Button variant="ghost" onClick={onDelete} icon="delete">
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 border-border-warm bg-warm-off-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-muted-gray-text mb-1">
            {provider.name}
          </h4>
          <p className="text-sm text-light-gray-text">
            {provider.model} • {provider.baseUrl}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit} icon="edit">
            Edit
          </Button>
          <Button variant="ghost" onClick={onDelete} icon="delete">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
});

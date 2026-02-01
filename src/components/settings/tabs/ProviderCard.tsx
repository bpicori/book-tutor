import { memo } from "react";
import type { LLMProvider, LLMProviderType } from "../../../types";
import { Button } from "../../common";
import { PROVIDER_TYPES } from "../../../constants";

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

const getProviderLabel = (type: LLMProviderType): string => {
  const info = PROVIDER_TYPES.find((p) => p.type === type);
  return info?.label ?? type;
};

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
              placeholder="My Groq"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-gray-text mb-2">
              Provider Type
            </label>
            <select
              value={provider.type}
              onChange={(e) =>
                onUpdate({ type: e.target.value as LLMProviderType })
              }
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
            >
              {PROVIDER_TYPES.map((pt) => (
                <option key={pt.type} value={pt.type}>
                  {pt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-light-gray-text">
              {
                PROVIDER_TYPES.find((p) => p.type === provider.type)
                  ?.description
              }
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
                onChange={(e) => onUpdate({ apiKey: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent pr-12"
                placeholder="gsk_..."
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
              Priority
            </label>
            <input
              type="number"
              min="0"
              value={provider.priority}
              onChange={(e) =>
                onUpdate({ priority: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
            />
            <p className="mt-1 text-xs text-light-gray-text">
              Lower number = higher priority. Providers are tried in priority
              order.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={provider.enabled}
                onChange={(e) => onUpdate({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest-green rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-green"></div>
            </label>
            <span className="text-sm text-muted-gray-text">Enabled</span>
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
    <div
      className={`border rounded-lg p-4 border-border-warm bg-warm-off-white ${!provider.enabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-muted-gray-text">
              {provider.name}
            </h4>
            {!provider.enabled && (
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                Disabled
              </span>
            )}
          </div>
          <p className="text-sm text-light-gray-text">
            {getProviderLabel(provider.type)} • Priority: {provider.priority}
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

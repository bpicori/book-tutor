import { memo, useState } from "react";
import type { ReaderSettings, LLMProvider } from "../../../types";
import { Button } from "../../common";
import { DEFAULT_LLM_PROVIDER } from "../../../constants";

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
  const [editingProviderId, setEditingProviderId] = useState<string | null>(
    null
  );
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const providers = settings.llmProviders || [];
  const assignments = settings.llmAssignments || {
    previewProvider: null,
    askProvider: null,
    translationProvider: null,
  };

  const toggleShowApiKey = (providerId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const handleAddProvider = () => {
    const newProvider: LLMProvider = {
      id: `provider-${Date.now()}`,
      name: `Provider ${providers.length + 1}`,
      apiKey: "",
      baseUrl: DEFAULT_LLM_PROVIDER.baseUrl,
      model: DEFAULT_LLM_PROVIDER.model,
    };
    onUpdate({
      llmProviders: [...providers, newProvider],
    });
    setEditingProviderId(newProvider.id);
  };

  const handleUpdateProvider = (
    providerId: string,
    updates: Partial<LLMProvider>
  ) => {
    const updatedProviders = providers.map((p) =>
      p.id === providerId ? { ...p, ...updates } : p
    );
    onUpdate({ llmProviders: updatedProviders });
  };

  const handleDeleteProvider = (providerId: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) {
      return;
    }

    const updatedProviders = providers.filter((p) => p.id !== providerId);
    const updatedAssignments = { ...assignments };

    // Clear assignments that reference the deleted provider
    if (assignments.previewProvider === providerId) {
      updatedAssignments.previewProvider = null;
    }
    if (assignments.askProvider === providerId) {
      updatedAssignments.askProvider = null;
    }
    if (assignments.translationProvider === providerId) {
      updatedAssignments.translationProvider = null;
    }

    onUpdate({
      llmProviders: updatedProviders,
      llmAssignments: updatedAssignments,
    });

    if (editingProviderId === providerId) {
      setEditingProviderId(null);
    }
  };

  const handleAssignmentChange = (
    useCase: "previewProvider" | "askProvider" | "translationProvider",
    providerId: string | null
  ) => {
    onUpdate({
      llmAssignments: {
        ...assignments,
        [useCase]: providerId,
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Providers Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-muted-gray-text">
            LLM Providers
          </h3>
          <Button variant="primary" onClick={handleAddProvider} icon="add">
            Add Provider
          </Button>
        </div>
        <p className="text-sm text-light-gray-text mb-6">
          Configure multiple LLM providers and assign them to different use
          cases.
        </p>

        {providers.length === 0 ? (
          <div className="text-center py-8 border border-border-warm rounded-lg bg-warm-off-white/50">
            <p className="text-light-gray-text mb-4">No providers configured</p>
            <Button variant="primary" onClick={handleAddProvider} icon="add">
              Add Your First Provider
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`border rounded-lg p-4 ${
                  editingProviderId === provider.id
                    ? "border-forest-green bg-warm-off-white"
                    : "border-border-warm bg-warm-off-white"
                }`}
              >
                {editingProviderId === provider.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-gray-text mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={provider.name}
                        onChange={(e) =>
                          handleUpdateProvider(provider.id, {
                            name: e.target.value,
                          })
                        }
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
                          type={showApiKeys[provider.id] ? "text" : "password"}
                          value={provider.apiKey}
                          onChange={(e) =>
                            handleUpdateProvider(provider.id, {
                              apiKey: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent pr-12"
                          placeholder="sk-..."
                        />
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => toggleShowApiKey(provider.id)}
                          icon={
                            showApiKeys[provider.id]
                              ? "visibility_off"
                              : "visibility"
                          }
                          className="absolute inset-y-0 right-0 w-12 h-full rounded-l-none hover:text-forest-green"
                          aria-label={
                            showApiKeys[provider.id]
                              ? "Hide API key"
                              : "Show API key"
                          }
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
                        onChange={(e) =>
                          handleUpdateProvider(provider.id, {
                            baseUrl: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          handleUpdateProvider(provider.id, {
                            model: e.target.value,
                          })
                        }
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
                      <Button
                        variant="primary"
                        onClick={() => setEditingProviderId(null)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteProvider(provider.id)}
                        icon="delete"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
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
                      <Button
                        variant="ghost"
                        onClick={() => setEditingProviderId(provider.id)}
                        icon="edit"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteProvider(provider.id)}
                        icon="delete"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments Section */}
      {providers.length > 0 && (
        <div className="border-t border-border-warm pt-6">
          <h3 className="text-lg font-semibold text-muted-gray-text mb-4">
            Provider Assignments
          </h3>
          <p className="text-sm text-light-gray-text mb-6">
            Choose which provider to use for each feature.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-gray-text mb-3">
                Chapter Preview
              </label>
              <select
                value={assignments.previewProvider || ""}
                onChange={(e) =>
                  handleAssignmentChange(
                    "previewProvider",
                    e.target.value || null
                  )
                }
                className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              >
                <option value="">None</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-light-gray-text">
                Provider used for generating chapter previews and summaries.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-gray-text mb-3">
                Ask AI Chat
              </label>
              <select
                value={assignments.askProvider || ""}
                onChange={(e) =>
                  handleAssignmentChange("askProvider", e.target.value || null)
                }
                className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              >
                <option value="">None</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-light-gray-text">
                Provider used for Ask AI chat conversations.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-gray-text mb-3">
                Translation
              </label>
              <select
                value={assignments.translationProvider || ""}
                onChange={(e) =>
                  handleAssignmentChange(
                    "translationProvider",
                    e.target.value || null
                  )
                }
                className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
              >
                <option value="">None</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-light-gray-text">
                Provider used for word translations and definitions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

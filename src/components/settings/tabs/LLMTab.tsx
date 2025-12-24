import { memo, useState } from "react";
import type { ReaderSettings, LLMProvider } from "../../../types";
import { Button } from "../../common";
import { DEFAULT_LLM_PROVIDER } from "../../../constants";
import { ProviderCard } from "./ProviderCard";
import { ProviderAssignments } from "./ProviderAssignments";

interface LLMTabProps {
  settings: ReaderSettings;
  onUpdate: (settings: Partial<ReaderSettings>) => void;
}

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

  const handleSaveProvider = () => {
    setEditingProviderId(null);
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
              <ProviderCard
                key={provider.id}
                provider={provider}
                isEditing={editingProviderId === provider.id}
                showApiKey={showApiKeys[provider.id] || false}
                onEdit={() => setEditingProviderId(provider.id)}
                onDelete={() => handleDeleteProvider(provider.id)}
                onToggleShowApiKey={() => toggleShowApiKey(provider.id)}
                onUpdate={(updates) =>
                  handleUpdateProvider(provider.id, updates)
                }
                onSave={handleSaveProvider}
              />
            ))}
          </div>
        )}
      </div>

      {/* Assignments Section */}
      {providers.length > 0 && (
        <ProviderAssignments
          providers={providers}
          assignments={assignments}
          onAssignmentChange={handleAssignmentChange}
        />
      )}
    </div>
  );
});

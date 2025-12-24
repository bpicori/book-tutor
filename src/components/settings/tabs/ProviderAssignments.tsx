import { memo } from "react";
import type { LLMProvider, LLMProviderAssignments } from "../../../types";

interface ProviderAssignmentsProps {
  providers: LLMProvider[];
  assignments: LLMProviderAssignments;
  onAssignmentChange: (
    useCase: "previewProvider" | "askProvider" | "translationProvider",
    providerId: string | null
  ) => void;
}

export const ProviderAssignments = memo(function ProviderAssignments({
  providers,
  assignments,
  onAssignmentChange,
}: ProviderAssignmentsProps) {
  return (
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
              onAssignmentChange("previewProvider", e.target.value || null)
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
              onAssignmentChange("askProvider", e.target.value || null)
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
              onAssignmentChange("translationProvider", e.target.value || null)
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
  );
});

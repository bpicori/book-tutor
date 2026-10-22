import { useId, useMemo, useCallback, useState } from "react";
import type { LLMModelConfig, LLMProviderConfig } from "../../types";
import { fetchModels } from "../../services/llmProviderService";
import { Button } from "../ui/Button";
import { Field, Select, TextInput } from "../ui/Field";

interface ModelFieldProps {
  label: string;
  description: string;
  value: string;
  availableModels: string[];
  onChange: (value: string) => void;
}

export function ModelField({
  label,
  description,
  value,
  availableModels,
  onChange,
}: ModelFieldProps) {
  const id = useId();
  const hasModels = availableModels.length > 0;

  return (
    <Field label={label} htmlFor={id} hint={description}>
      {hasModels ? (
        <Select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {!availableModels.includes(value) && value && (
            <option value={value}>{value}</option>
          )}
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </Select>
      ) : (
        <TextInput
          id={id}
          value={value}
          spellCheck={false}
          autoComplete="off"
          placeholder="Enter a model id"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

interface ModelConfigProps {
  provider: LLMProviderConfig;
  models: LLMModelConfig;
  onModelChange: (updates: Partial<LLMModelConfig>) => void;
}

export function ModelConfig({
  provider,
  models,
  onModelChange,
}: ModelConfigProps) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLoad = useMemo(
    () => Boolean(provider.apiKey.trim()),
    [provider.apiKey]
  );

  const handleLoadModels = useCallback(async () => {
    if (!canLoad) {
      setError("Enter an API key to fetch available models.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const modelIds = await fetchModels(provider);
      if (modelIds.length === 0) {
        setError("No models found. Check your API key and base URL.");
      }
      setAvailableModels(modelIds);
      setHasLoaded(true);
    } catch {
      setError("Failed to fetch models. Check your API key and base URL.");
      setAvailableModels([]);
    } finally {
      setIsLoading(false);
    }
  }, [canLoad, provider]);

  return (
    <div className="model-config">
      <div className="control-label">
        <span>Models</span>
        <b>{hasLoaded ? `${availableModels.length} found` : "Optional"}</b>
      </div>
      <p className="note" style={{ marginTop: 0 }}>
        Fetch the ids your provider publishes, or type one in.
      </p>

      <div className="row-actions">
        <Button
          variant="secondary"
          onClick={handleLoadModels}
          loading={isLoading}
          disabled={!canLoad}
        >
          {hasLoaded ? "Reload models" : "Load models"}
        </Button>
        {error && (
          <p className="status" role="status" data-state="error">
            {error}
          </p>
        )}
      </div>

      <div className="form-stack" style={{ marginTop: 18 }}>
        <ModelField
          label="Preview model"
          description="Used for chapter previews and summaries."
          value={models.previewModel}
          availableModels={availableModels}
          onChange={(previewModel) => onModelChange({ previewModel })}
        />
        <ModelField
          label="Ask model"
          description="Used for Ask conversations about the book."
          value={models.askModel}
          availableModels={availableModels}
          onChange={(askModel) => onModelChange({ askModel })}
        />
        <ModelField
          label="Definitions model"
          description="Used for definitions and translations."
          value={models.translationModel}
          availableModels={availableModels}
          onChange={(translationModel) => onModelChange({ translationModel })}
        />
      </div>
    </div>
  );
}

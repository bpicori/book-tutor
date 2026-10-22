import { useState } from "react";
import { DEFAULT_LLM_BASE_URL, OPENROUTER_BASE_URL } from "../../../constants";
import type { LLMModelConfig, LLMProviderConfig } from "../../../types";
import { useStore } from "../../../store/useStore";
import { Button } from "../../ui/Button";
import { Field, TextInput } from "../../ui/Field";
import { Segmented } from "../../ui/Segmented";
import { Switch } from "../../ui/Switch";
import { ModelConfig } from "../ModelConfig";

type ProviderChoice = "openai" | "openrouter" | "custom";

const PROVIDER_OPTIONS: { value: ProviderChoice; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom" },
];

function inferProvider(baseUrl: string): ProviderChoice {
  if (baseUrl.includes("openrouter.ai")) return "openrouter";
  if (baseUrl.includes("api.openai.com")) return "openai";
  return "custom";
}

type CheckStatus = { state: "ok" | "error"; text: string } | null;

export function GuideSettingsPanel() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const [showKey, setShowKey] = useState(false);
  const [providerChoice, setProviderChoice] = useState<ProviderChoice>(() =>
    inferProvider(settings.llmProvider.baseUrl)
  );
  const [status, setStatus] = useState<CheckStatus>(null);

  const provider = settings.llmProvider;
  const models = settings.llmModels;

  const handleProvider = (choice: ProviderChoice) => {
    setProviderChoice(choice);
    setStatus(null);
    if (choice === "openai") {
      updateSettings({
        llmProvider: { ...provider, baseUrl: DEFAULT_LLM_BASE_URL },
      });
    } else if (choice === "openrouter") {
      updateSettings({
        llmProvider: { ...provider, baseUrl: OPENROUTER_BASE_URL },
      });
    }
  };

  const handleProviderUpdate = (updates: Partial<LLMProviderConfig>) => {
    updateSettings({
      llmProvider: {
        ...provider,
        ...updates,
      },
    });
    setStatus(null);
  };

  const handleModelChange = (updates: Partial<LLMModelConfig>) => {
    updateSettings({
      llmModels: {
        ...models,
        ...updates,
      },
    });
    setStatus(null);
  };

  const handleCheck = () => {
    let error = "";
    try {
      const url = new URL(provider.baseUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        error = "Use an http or https base URL.";
      }
    } catch {
      error = "Enter a valid base URL.";
    }

    if (!error && provider.apiKey.trim().length < 8) {
      error = "Add an API key before checking.";
    }
    if (!error && (!models.previewModel.trim() || !models.askModel.trim())) {
      error = "Add a model for preview and ask.";
    }
    if (!error && !models.translationModel.trim()) {
      error = "Add a model for definitions.";
    }

    setStatus(
      error
        ? { state: "error", text: error }
        : {
            state: "ok",
            text: "Setup looks complete. Requests go straight from this browser.",
          }
    );
  };

  return (
    <>
      <div className="set-head">
        <h2>The guide</h2>
        <p>
          The guide sees one chapter at a time. Your key stays in this browser
          and goes only to the provider you choose.
        </p>
      </div>

      <div className="form-grid">
        <div className="field span-2">
          <label>Provider</label>
          <Segmented
            options={PROVIDER_OPTIONS}
            value={providerChoice}
            onChange={handleProvider}
            label="LLM provider"
          />
        </div>

        <Field label="Base URL" htmlFor="ai-url" span2>
          <TextInput
            id="ai-url"
            value={provider.baseUrl}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) =>
              handleProviderUpdate({ baseUrl: event.target.value })
            }
          />
        </Field>

        <Field label="API key" htmlFor="ai-key" span2>
          <div className="key-wrap">
            <TextInput
              id="ai-key"
              type={showKey ? "text" : "password"}
              value={provider.apiKey}
              placeholder="sk-…"
              spellCheck={false}
              autoComplete="off"
              onChange={(event) =>
                handleProviderUpdate({ apiKey: event.target.value })
              }
            />
            <button
              type="button"
              className="key-reveal"
              onClick={() => setShowKey((value) => !value)}
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="note">
            Held in this browser and sent only to your provider.
          </p>
        </Field>
      </div>

      <ModelConfig
        provider={provider}
        models={models}
        onModelChange={handleModelChange}
      />

      <div className="setting-list">
        <div className="toggle-row">
          <div>
            <p className="toggle-title">Carry earlier chapter summaries</p>
            <p className="toggle-sub">
              Give the guide a short memory of what came before, so answers can
              connect the thread.
            </p>
          </div>
          <Switch
            checked={settings.carryBookMemory}
            onChange={(carryBookMemory) => updateSettings({ carryBookMemory })}
            label="Carry earlier chapter summaries"
          />
        </div>
      </div>

      <p className="note">
        Previews stop at the end of the chapter you are reading. The guide does
        not read ahead.
      </p>

      <div className="status-row">
        <Button variant="secondary" onClick={handleCheck}>
          Check setup
        </Button>
        <p
          className="status"
          role="status"
          data-state={status?.state ?? undefined}
        >
          {status?.text ?? "Not checked yet."}
        </p>
      </div>
    </>
  );
}

import { useMemo, useState } from "react";
import type { SpeechProviderConfig, SpeechProviderType } from "../../../types";
import { DEFAULT_SPEECH_PROVIDER } from "../../../constants";
import {
  SPEECH_PROVIDER_PRESETS,
  generateSpeech,
  listSpeechModels,
  type SpeechModelOption,
} from "../../../services/speechService";
import { LLMServiceError } from "../../../services/llmClient";
import { useStore } from "../../../store/useStore";
import { Button } from "../../ui/Button";
import { Field, Range, Select, TextInput } from "../../ui/Field";
import { Segmented } from "../../ui/Segmented";

const PRESET_OPTIONS: { value: SpeechProviderType; label: string }[] = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai", label: "OpenAI" },
  { value: "custom", label: "Custom" },
];

type Status = { state: "ok" | "error"; text: string } | null;

export function VoicePanel() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const provider = settings.speechProvider ?? DEFAULT_SPEECH_PROVIDER;

  const [showApiKey, setShowApiKey] = useState(false);
  const [models, setModels] = useState<SpeechModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === provider.model),
    [models, provider.model]
  );

  const handleUpdate = (updates: Partial<SpeechProviderConfig>) => {
    updateSettings({ speechProvider: { ...provider, ...updates } });
    setStatus(null);
  };

  const handlePreset = (type: SpeechProviderType) => {
    const preset = SPEECH_PROVIDER_PRESETS[type];
    updateSettings({
      speechProvider: {
        ...provider,
        type,
        baseUrl: preset.baseUrl || provider.baseUrl,
        model: preset.model || provider.model,
        voice: preset.voice || provider.voice,
      },
    });
    setModels([]);
    setStatus(null);
  };

  const handleLoadModels = async () => {
    setStatus(null);
    setIsLoadingModels(true);
    try {
      const loaded = await listSpeechModels(provider);
      setModels(loaded);
      if (loaded.length === 0) {
        setStatus({
          state: "error",
          text: "No speech models found for this provider.",
        });
      }
    } catch (error) {
      setStatus({
        state: "error",
        text:
          error instanceof LLMServiceError
            ? error.message
            : "Failed to load speech models.",
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestVoice = async () => {
    setStatus(null);
    setIsTesting(true);
    try {
      const blob = await generateSpeech(
        "This is how I will read your book. Let's begin.",
        {
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: provider.model,
          voice: provider.voice,
        }
      );
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      const cleanup = () => URL.revokeObjectURL(url);
      audio.addEventListener("ended", cleanup);
      audio.addEventListener("error", () => {
        cleanup();
        setStatus({ state: "error", text: "Could not play the audio." });
      });
      await audio.play();
      setStatus({ state: "ok", text: "Sample played." });
    } catch (error) {
      setStatus({
        state: "error",
        text:
          error instanceof LLMServiceError
            ? error.message
            : "Could not generate speech.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const rate = Math.round(settings.playbackRate * 10) / 10;

  return (
    <>
      <div className="set-head">
        <h2>Voice</h2>
        <p>
          Listen while you read. Reading aloud sends each paragraph to the
          speech provider you configure; it never uploads the book file itself.
        </p>
      </div>

      <div className="form-grid">
        <div className="field span-2">
          <label>Provider</label>
          <Segmented
            options={PRESET_OPTIONS}
            value={provider.type}
            onChange={handlePreset}
            label="Speech provider"
          />
        </div>

        <Field label="Base URL" htmlFor="voice-url" span2>
          <TextInput
            id="voice-url"
            value={provider.baseUrl}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => handleUpdate({ baseUrl: event.target.value })}
          />
        </Field>

        <Field label="API key" htmlFor="voice-key" span2>
          <div className="key-wrap">
            <TextInput
              id="voice-key"
              type={showApiKey ? "text" : "password"}
              value={provider.apiKey}
              placeholder="sk-…"
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => handleUpdate({ apiKey: event.target.value })}
            />
            <button
              type="button"
              className="key-reveal"
              onClick={() => setShowApiKey((value) => !value)}
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="note">
            Stored in this browser and sent only to the speech provider.
          </p>
        </Field>

        <Field label="Model" htmlFor="voice-model">
          {models.length > 0 ? (
            <Select
              id="voice-model"
              value={provider.model}
              onChange={(event) => handleUpdate({ model: event.target.value })}
            >
              {!models.some((model) => model.id === provider.model) && (
                <option value={provider.model}>{provider.model}</option>
              )}
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name ? `${model.name} (${model.id})` : model.id}
                </option>
              ))}
            </Select>
          ) : (
            <TextInput
              id="voice-model"
              value={provider.model}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => handleUpdate({ model: event.target.value })}
            />
          )}
        </Field>

        <Field label="Voice" htmlFor="voice-name">
          {selectedModel && selectedModel.voices.length > 0 ? (
            <Select
              id="voice-name"
              value={provider.voice}
              onChange={(event) => handleUpdate({ voice: event.target.value })}
            >
              {selectedModel.voices.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </Select>
          ) : (
            <TextInput
              id="voice-name"
              value={provider.voice}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => handleUpdate({ voice: event.target.value })}
            />
          )}
        </Field>

        <div className="field span-2">
          <div className="control-label">
            <span>Speed</span>
            <b>{rate.toFixed(1)}×</b>
          </div>
          <Range
            value={settings.playbackRate}
            min={0.6}
            max={1.6}
            step={0.05}
            label="Reading speed"
            onChange={(playbackRate) => updateSettings({ playbackRate })}
          />
          <div className="range-scale">
            <span>0.6×</span>
            <span>1.6×</span>
          </div>
        </div>
      </div>

      <div className="voice-test-row">
        <Button
          variant="secondary"
          onClick={handleLoadModels}
          loading={isLoadingModels}
          disabled={!provider.apiKey.trim()}
        >
          Load models
        </Button>
        <Button
          variant="secondary"
          onClick={handleTestVoice}
          loading={isTesting}
          disabled={!provider.apiKey.trim()}
        >
          Test voice
        </Button>
        {status && (
          <p className="inline-status" role="status" data-state={status.state}>
            {status.text}
          </p>
        )}
      </div>

      <p className="note">
        Voices depend on the model. Load models to see the list this model
        publishes.
      </p>
    </>
  );
}

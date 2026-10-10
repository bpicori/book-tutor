import { memo, useMemo, useState } from "react";
import type {
  ReaderSettings,
  SpeechProviderConfig,
  SpeechProviderType,
} from "../../../types";
import { DEFAULT_SPEECH_PROVIDER } from "../../../constants";
import { Button, SegmentedTabs } from "../../common";
import { StatusBanner } from "../StatusBanner";
import {
  SPEECH_PROVIDER_PRESETS,
  generateSpeech,
  listSpeechModels,
  type SpeechModelOption,
} from "../../../services/speechService";
import { LLMServiceError } from "../../../services/llmClient";

interface SpeechTabProps {
  settings: ReaderSettings;
  onUpdate: (settings: Partial<ReaderSettings>) => void;
}

const PRESETS = [
  { id: "openrouter", label: "OpenRouter" },
  { id: "openai", label: "OpenAI" },
  { id: "custom", label: "Custom" },
];

const INPUT_CLASS =
  "w-full px-4 py-2 rounded-lg border border-border-warm bg-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent";

export const SpeechTab = memo(function SpeechTab({
  settings,
  onUpdate,
}: SpeechTabProps) {
  const provider = settings.speechProvider ?? DEFAULT_SPEECH_PROVIDER;
  const [showApiKey, setShowApiKey] = useState(false);
  const [models, setModels] = useState<SpeechModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testPlayed, setTestPlayed] = useState(false);

  const handleUpdate = (updates: Partial<SpeechProviderConfig>) => {
    onUpdate({ speechProvider: { ...provider, ...updates } });
  };

  const handlePreset = (type: SpeechProviderType) => {
    const preset = SPEECH_PROVIDER_PRESETS[type];
    onUpdate({
      speechProvider: {
        ...provider,
        type,
        baseUrl: preset.baseUrl || provider.baseUrl,
        model: preset.model || provider.model,
        voice: preset.voice || provider.voice,
      },
    });
    setModels([]);
    setModelError(null);
  };

  const selectedModel = useMemo(
    () => models.find((model) => model.id === provider.model),
    [models, provider.model]
  );

  const handleLoadModels = async () => {
    setModelError(null);
    setIsLoadingModels(true);
    try {
      const loaded = await listSpeechModels(provider);
      setModels(loaded);
      if (loaded.length === 0) {
        setModelError("No speech models found for this provider.");
      }
    } catch (err) {
      setModelError(
        err instanceof LLMServiceError
          ? err.message
          : "Failed to load speech models."
      );
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestVoice = async () => {
    setTestError(null);
    setTestPlayed(false);
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
      audio.addEventListener("ended", () => {
        cleanup();
        setTestPlayed(true);
      });
      audio.addEventListener("error", () => {
        cleanup();
        setTestError("Could not play the audio.");
      });
      await audio.play();
    } catch (err) {
      setTestError(
        err instanceof LLMServiceError
          ? err.message
          : "Could not generate speech."
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-muted-gray-text mb-4">
          Speech (Text-to-Speech)
        </h3>
        <p className="text-sm text-light-gray-text mb-6">
          Reading aloud sends the text of each paragraph to this provider. It
          uses a separate key from the LLM provider and is billed by the
          provider per character or minute. OpenRouter and OpenAI both expose
          the same OpenAI-compatible{" "}
          <code className="text-xs">/audio/speech</code> endpoint.
        </p>
        <SegmentedTabs
          tabs={PRESETS}
          activeId={provider.type}
          onChange={(id) => handlePreset(id as SpeechProviderType)}
        />
      </div>

      <div className="border rounded-lg p-4 border-border-warm bg-warm-off-white space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-2">
            Base URL
          </label>
          <input
            type="text"
            value={provider.baseUrl}
            onChange={(e) => handleUpdate({ baseUrl: e.target.value })}
            className={INPUT_CLASS}
            placeholder="https://openrouter.ai/api/v1"
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
              onChange={(e) => handleUpdate({ apiKey: e.target.value })}
              className={`${INPUT_CLASS} pr-12`}
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
          <p className="mt-1 text-xs text-light-gray-text">
            Stored on this device, like the LLM key, and never sent anywhere
            except the speech provider.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-semibold text-muted-gray-text">
            Model &amp; Voice
          </h4>
          <Button
            variant="primary"
            onClick={handleLoadModels}
            disabled={isLoadingModels || !provider.apiKey.trim()}
            icon={isLoadingModels ? "sync" : "refresh"}
            className={isLoadingModels ? "animate-spin" : ""}
          >
            {isLoadingModels ? "Loading..." : "Load models"}
          </Button>
        </div>

        {modelError && (
          <StatusBanner variant="warning">{modelError}</StatusBanner>
        )}

        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-2">
            Model
          </label>
          {models.length > 0 ? (
            <select
              value={provider.model}
              onChange={(e) => handleUpdate({ model: e.target.value })}
              className={INPUT_CLASS}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name ? `${model.name} (${model.id})` : model.id}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={provider.model}
              onChange={(e) => handleUpdate({ model: e.target.value })}
              className={INPUT_CLASS}
              placeholder="google/gemini-3.8-flash-lite-tts"
            />
          )}
          <p className="mt-1 text-xs text-light-gray-text">
            Only text-to-speech models. On OpenRouter, &ldquo;Load models&rdquo;
            asks for models whose output modality is speech.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-gray-text mb-2">
            Voice
          </label>
          {selectedModel && selectedModel.voices.length > 0 ? (
            <select
              value={provider.voice}
              onChange={(e) => handleUpdate({ voice: e.target.value })}
              className={INPUT_CLASS}
            >
              {selectedModel.voices.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={provider.voice}
              onChange={(e) => handleUpdate({ voice: e.target.value })}
              className={INPUT_CLASS}
              placeholder="Kore"
            />
          )}
          <p className="mt-1 text-xs text-light-gray-text">
            Voices depend on the model. Load models to see the list this model
            publishes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleTestVoice}
            disabled={isTesting}
            icon={isTesting ? "progress_activity" : "play_arrow"}
            className={isTesting ? "[&_span]:animate-spin" : ""}
          >
            {isTesting ? "Generating..." : "Test voice"}
          </Button>
          {testError ? (
            <p className="text-xs text-red-600">{testError}</p>
          ) : testPlayed ? (
            <p className="text-xs text-green-700">Sample played.</p>
          ) : (
            <p className="text-xs text-light-gray-text">
              Speaks a short sample. Costs a fraction of a cent.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

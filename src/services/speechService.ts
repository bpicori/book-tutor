import {
  DEFAULT_LLM_BASE_URL,
  DEFAULT_SPEECH_PROVIDER,
  OPENROUTER_BASE_URL,
} from "../constants";
import type { SpeechProviderConfig, SpeechProviderType } from "../types";
import { LLMServiceError } from "./llmClient";

/**
 * Text-to-speech client for OpenAI-compatible `/audio/speech` endpoints.
 *
 * OpenRouter exposes the exact same request/response shape as OpenAI, so a
 * single fetch covers both providers; only the base URL, model naming, and
 * voice list differ. The response is a raw audio byte stream, not JSON.
 */

export interface SpeechRequestSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  voice: string;
}

export interface SpeechModelOption {
  id: string;
  name?: string;
  /** Voices advertised by the provider for this model, when it publishes them. */
  voices: string[];
}

/** Defaults applied when the reader picks a provider preset. */
export const SPEECH_PROVIDER_PRESETS: Record<
  SpeechProviderType,
  { baseUrl: string; model: string; voice: string }
> = {
  openrouter: {
    baseUrl: OPENROUTER_BASE_URL,
    model: "google/gemini-3.8-flash-lite-tts",
    voice: "Kore",
  },
  openai: {
    baseUrl: DEFAULT_LLM_BASE_URL,
    model: "gpt-4o-mini-tts",
    voice: "alloy",
  },
  custom: {
    baseUrl: "",
    model: "",
    voice: "",
  },
};

export function resolveSpeechBaseUrl(provider: SpeechProviderConfig): string {
  const base = provider.baseUrl?.trim();
  if (base) return base.replace(/\/+$/, "");
  if (provider.type === "openrouter") return OPENROUTER_BASE_URL;
  if (provider.type === "openai") return DEFAULT_LLM_BASE_URL;
  return "";
}

function validateSettings(
  settings: SpeechRequestSettings
): SpeechRequestSettings {
  if (!settings.apiKey || settings.apiKey.trim() === "") {
    throw new LLMServiceError(
      "Speech is not configured. Add a speech API key in Settings.",
      "NO_API_KEY"
    );
  }

  const baseUrl = settings.baseUrl?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new LLMServiceError(
      "Speech provider URL is missing. Check the speech settings.",
      "NO_BASE_URL"
    );
  }

  if (!settings.model?.trim()) {
    throw new LLMServiceError(
      "No speech model selected. Pick one in Settings.",
      "NO_MODEL"
    );
  }

  if (!settings.voice?.trim()) {
    throw new LLMServiceError(
      "No voice selected. Pick one in Settings.",
      "NO_VOICE"
    );
  }

  return {
    apiKey: settings.apiKey,
    baseUrl,
    model: settings.model.trim(),
    voice: settings.voice.trim(),
  };
}

async function readErrorDetail(
  response: Response
): Promise<string | undefined> {
  try {
    const data = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    };
    return data?.error?.message ?? data?.message;
  } catch {
    return undefined;
  }
}

function errorForStatus(status: number, detail?: string): LLMServiceError {
  switch (status) {
    case 400:
      return new LLMServiceError(
        detail ||
          "The speech provider rejected the request. Check the model and voice.",
        "BAD_REQUEST"
      );
    case 401:
      return new LLMServiceError(
        "Invalid speech API key. Check it in Settings.",
        "INVALID_API_KEY"
      );
    case 402:
      return new LLMServiceError(
        "The speech provider account is out of credits.",
        "PAYMENT_REQUIRED"
      );
    case 403:
      return new LLMServiceError(
        detail || "The speech provider refused the request.",
        "FORBIDDEN"
      );
    case 404:
      return new LLMServiceError(
        "Speech model or endpoint not found. This provider may not support audio. Check the speech settings.",
        "MODEL_NOT_FOUND"
      );
    case 413:
      return new LLMServiceError(
        "This paragraph is too long for the speech model.",
        "PAYLOAD_TOO_LARGE"
      );
    case 429:
      return new LLMServiceError(
        "Speech rate limit exceeded. Try again in a moment.",
        "RATE_LIMIT"
      );
    default:
      if (status >= 500) {
        return new LLMServiceError(
          "The speech provider had a problem. Try again.",
          "PROVIDER_ERROR"
        );
      }
      return new LLMServiceError(
        detail || "Speech synthesis failed.",
        "SPEECH_ERROR"
      );
  }
}

type SpeechAudioFormat = "mp3" | "pcm";

/** Raw PCM defaults used by OpenRouter/OpenAI speech models (24 kHz mono). */
const PCM_SAMPLE_RATE = 24000;
const PCM_CHANNELS = 1;
const PCM_BITS_PER_SAMPLE = 16;

/** Remembers which audio format a provider+model accepted, per session. */
const preferredFormat = new Map<string, SpeechAudioFormat>();

function isFormatError(status: number, detail?: string): boolean {
  if (status !== 400 && status !== 422) return false;
  return /response_format|pcm|mp3|audio format|unsupported/i.test(detail ?? "");
}

/**
 * First format to request. `pcm` is the documented default and is supported
 * everywhere; Gemini TTS is known to reject `mp3`, so ask for `pcm` directly.
 */
function initialFormat(model: string): SpeechAudioFormat {
  return /gemini/i.test(model) ? "pcm" : "mp3";
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/** Wraps raw PCM samples in a WAV container so the browser can play them. */
function pcmToWavBlob(pcm: ArrayBuffer): Blob {
  const blockAlign = (PCM_CHANNELS * PCM_BITS_PER_SAMPLE) / 8;
  const byteRate = PCM_SAMPLE_RATE * blockAlign;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, PCM_CHANNELS, true);
  view.setUint32(24, PCM_SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, PCM_BITS_PER_SAMPLE, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.byteLength, true);

  return new Blob([header, pcm], { type: "audio/wav" });
}

function requestSpeech(
  resolved: SpeechRequestSettings,
  input: string,
  format: SpeechAudioFormat,
  signal?: AbortSignal
): Promise<Response> {
  return fetch(`${resolved.baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolved.apiKey}`,
    },
    body: JSON.stringify({
      model: resolved.model,
      input,
      voice: resolved.voice,
      response_format: format,
    }),
    signal,
  });
}

/**
 * Synthesizes one paragraph and returns playable audio.
 *
 * Most models accept `mp3`, but some (Gemini TTS on OpenRouter, for example)
 * only support the documented default, `pcm`. The first format rejection for
 * a model is remembered so later paragraphs ask for the right one directly;
 * raw PCM is wrapped in a WAV container before it reaches the audio element.
 */
export async function generateSpeech(
  text: string,
  settings: SpeechRequestSettings,
  signal?: AbortSignal
): Promise<Blob> {
  const resolved = validateSettings(settings);
  const input = text.trim();
  if (!input) {
    throw new LLMServiceError("Nothing to read.", "EMPTY_INPUT");
  }

  const attemptKey = `${resolved.baseUrl}|${resolved.model}`;
  const preferred =
    preferredFormat.get(attemptKey) ?? initialFormat(resolved.model);
  let format: SpeechAudioFormat = preferred;

  const send = async (value: SpeechAudioFormat): Promise<Response> => {
    try {
      return await requestSpeech(resolved, input, value, signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      throw new LLMServiceError(
        "Failed to connect to the speech provider. Check your network connection.",
        "NETWORK_ERROR"
      );
    }
  };

  let response = await send(preferred);

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    if (preferred === "mp3" && isFormatError(response.status, detail)) {
      response = await send("pcm");
      if (response.ok) {
        format = "pcm";
        preferredFormat.set(attemptKey, "pcm");
      } else {
        throw errorForStatus(response.status, await readErrorDetail(response));
      }
    } else {
      throw errorForStatus(response.status, detail);
    }
  }

  if (format === "pcm") {
    const pcm = await response.arrayBuffer();
    if (!pcm || pcm.byteLength === 0) {
      throw new LLMServiceError(
        "The speech provider returned empty audio.",
        "EMPTY_AUDIO"
      );
    }
    return pcmToWavBlob(pcm);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new LLMServiceError(
      "The speech provider returned empty audio.",
      "EMPTY_AUDIO"
    );
  }
  return blob;
}

/**
 * Lists models the speech provider offers. On OpenRouter this asks for agents
 * whose output modality is speech; elsewhere it falls back to the plain model
 * list. Voices are returned when the provider publishes them.
 */
export async function listSpeechModels(
  provider: SpeechProviderConfig
): Promise<SpeechModelOption[]> {
  if (!provider?.apiKey || provider.apiKey.trim() === "") {
    throw new LLMServiceError(
      "Enter a speech API key to load models.",
      "NO_API_KEY"
    );
  }

  const baseUrl = resolveSpeechBaseUrl(provider);
  if (!baseUrl) {
    throw new LLMServiceError(
      "Speech provider URL is missing. Check the speech settings.",
      "NO_BASE_URL"
    );
  }

  const url =
    provider.type === "openrouter"
      ? `${baseUrl}/models?output_modalities=speech`
      : `${baseUrl}/models`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${provider.apiKey}` },
    });
  } catch {
    throw new LLMServiceError(
      "Failed to connect to the speech provider. Check your network connection.",
      "NETWORK_ERROR"
    );
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw errorForStatus(response.status, detail);
  }

  const data = (await response.json()) as {
    data?: Array<{
      id?: string;
      name?: string;
      supported_voices?: string[];
      voices?: string[];
    }>;
  };

  return (data.data ?? [])
    .filter((model) => Boolean(model.id))
    .map((model) => ({
      id: model.id as string,
      name: model.name,
      voices: model.supported_voices ?? model.voices ?? [],
    }));
}

/** Speech provider with defaults filled in, for readers of persisted state. */
export function withSpeechDefaults(
  provider: SpeechProviderConfig | undefined
): SpeechProviderConfig {
  return provider ?? DEFAULT_SPEECH_PROVIDER;
}

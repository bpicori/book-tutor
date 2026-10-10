import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { DEFAULT_SPEECH_PROVIDER } from "../constants";
import type { SpeechProviderConfig } from "../types";
import type { SpeechRequestSettings } from "../services/speechService";

/** The configured speech provider, with defaults for pre-speech snapshots. */
export function useSpeechProvider(): SpeechProviderConfig {
  return useStore(
    (state) => state.settings.speechProvider ?? DEFAULT_SPEECH_PROVIDER
  );
}

/**
 * Speech settings in the shape the speech service expects. Returns `null` when
 * no speech API key is configured, so callers can show setup guidance instead
 * of issuing a request that is certain to fail.
 */
export function useSpeechSettings(): SpeechRequestSettings | null {
  const provider = useSpeechProvider();

  return useMemo(() => {
    if (!provider.apiKey || provider.apiKey.trim() === "") return null;

    const baseUrl = provider.baseUrl?.trim().replace(/\/+$/, "");
    if (!baseUrl || !provider.model?.trim() || !provider.voice?.trim()) {
      return null;
    }

    return {
      apiKey: provider.apiKey,
      baseUrl,
      model: provider.model.trim(),
      voice: provider.voice.trim(),
    };
  }, [provider]);
}

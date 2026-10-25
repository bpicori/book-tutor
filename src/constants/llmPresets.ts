/**
 * Endpoint presets for the reading guide.
 *
 * A preset only fills the base URL and points at the right key page — model
 * ids are fetched from the provider (`/models`) instead of hard-coded here,
 * so a preset cannot rot when a provider renames a model.
 */
export interface LLMPreset {
  id: string;
  label: string;
  baseUrl: string;
  /** Where to create a key. Omitted for local servers. */
  keyUrl?: string;
  note?: string;
}

export const LLM_PRESETS: LLMPreset[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    keyUrl: "https://openrouter.ai/keys",
    note: "One key for preview, ask and definitions. Free models are listed with a :free suffix.",
  },
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    keyUrl: "https://console.groq.com/keys",
    note: "Fast and inexpensive for previews.",
  },
  {
    id: "ollama",
    label: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    note: "Runs on this machine. Put any text in the key field.",
  },
  {
    id: "lmstudio",
    label: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    note: "Runs on this machine. Put any text in the key field.",
  },
];

/** Rough cost line shown under the key field, per million input tokens. */
export const MODEL_COST_HINT =
  "A chapter preview is usually a few thousand tokens — roughly $0.001 on a small model.";

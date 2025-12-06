import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import type { LLMSettings } from '../services/llmService'

/**
 * Hook to get LLM settings from the store in the format expected by LLMService
 */
export function useLLMSettings(): LLMSettings | null {
  const settings = useStore((state) => state.settings)

  return useMemo(() => {
    if (!settings.llmApiKey) {
      return null
    }

    return {
      apiKey: settings.llmApiKey,
      baseUrl: settings.llmBaseUrl,
      model: settings.llmModel,
    }
  }, [settings.llmApiKey, settings.llmBaseUrl, settings.llmModel])
}


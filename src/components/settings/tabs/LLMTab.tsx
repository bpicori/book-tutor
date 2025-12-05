import { memo, useState } from 'react'
import type { ReaderSettings } from '../../../types'

interface LLMTabProps {
  settings: ReaderSettings
  onUpdate: (settings: Partial<ReaderSettings>) => void
}

const commonModels = [
  { value: 'openai/gpt-5.1', label: 'GPT-5.1' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  {value: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5'},
]

export const LLMTab = memo(function LLMTab({ settings, onUpdate }: LLMTabProps) {
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={settings.llmApiKey}
            onChange={(e) => onUpdate({ llmApiKey: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent pr-12"
            placeholder="sk-..."
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-light-gray-text hover:text-forest-green transition-colors"
            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
          >
            <span className="material-symbols-outlined text-xl">
              {showApiKey ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        <p className="mt-2 text-xs text-light-gray-text">
          Your API key is stored locally and never shared.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Base URL
        </label>
        <input
          type="url"
          value={settings.llmBaseUrl}
          onChange={(e) => onUpdate({ llmBaseUrl: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
          placeholder="https://api.openai.com/v1"
        />
        <p className="mt-2 text-xs text-light-gray-text">
          Base URL for the OpenAI-compatible API endpoint.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Model
        </label>
        <input
          type="text"
          list="llm-models"
          value={settings.llmModel}
          onChange={(e) => onUpdate({ llmModel: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
          placeholder="gpt-4o-mini"
        />
        <datalist id="llm-models">
          {commonModels.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </datalist>
        <p className="mt-2 text-xs text-light-gray-text">
          Enter a model name (e.g., gpt-4o, gpt-4o-mini, gpt-3.5-turbo) or select from suggestions.
        </p>
      </div>
    </div>
  )
})


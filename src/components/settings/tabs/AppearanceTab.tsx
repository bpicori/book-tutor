import { memo } from 'react'
import type { ReaderSettings } from '../../../types'

interface AppearanceTabProps {
  settings: ReaderSettings
  onUpdate: (settings: Partial<ReaderSettings>) => void
}

export const AppearanceTab = memo(function AppearanceTab({ settings, onUpdate }: AppearanceTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Theme
        </label>
        <div className="space-y-1">
          {(['light', 'dark', 'sepia'] as const).map((theme) => (
            <label
              key={theme}
              className="flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-hover-warm transition-colors"
            >
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={settings.theme === theme}
                onChange={() => onUpdate({ theme })}
                className="w-4 h-4 text-forest-green focus:ring-forest-green focus:ring-2"
              />
              <span className="text-muted-gray-text capitalize">{theme}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
})


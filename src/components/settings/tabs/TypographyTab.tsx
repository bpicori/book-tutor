import { memo } from 'react'
import type { ReaderSettings } from '../../../types'

interface TypographyTabProps {
  settings: ReaderSettings
  onUpdate: (settings: Partial<ReaderSettings>) => void
}

const fontFamilies = [
  { value: 'Literata', label: 'Literata' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Merriweather', label: 'Merriweather' },
]

export const TypographyTab = memo(function TypographyTab({ settings, onUpdate }: TypographyTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Font Family
        </label>
        <select
          value={settings.fontFamily}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
        >
          {fontFamilies.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Font Size: {settings.fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="24"
          value={settings.fontSize}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className="w-full h-2 bg-border-warm rounded-lg appearance-none cursor-pointer accent-forest-green"
        />
        <div className="flex justify-between text-xs text-light-gray-text mt-1">
          <span>12px</span>
          <span>24px</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Line Height: {settings.lineHeight.toFixed(1)}
        </label>
        <input
          type="range"
          min="1.2"
          max="2.0"
          step="0.1"
          value={settings.lineHeight}
          onChange={(e) => onUpdate({ lineHeight: Number(e.target.value) })}
          className="w-full h-2 bg-border-warm rounded-lg appearance-none cursor-pointer accent-forest-green"
        />
        <div className="flex justify-between text-xs text-light-gray-text mt-1">
          <span>1.2</span>
          <span>2.0</span>
        </div>
      </div>
    </div>
  )
})


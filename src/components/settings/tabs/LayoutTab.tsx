import { memo } from 'react'
import type { ReaderSettings } from '../../../types'

interface LayoutTabProps {
  settings: ReaderSettings
  onUpdate: (settings: Partial<ReaderSettings>) => void
}

export const LayoutTab = memo(function LayoutTab({ settings, onUpdate }: LayoutTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Text Alignment
        </label>
        <div className="space-y-1">
          {(['left', 'justify'] as const).map((align) => (
            <label
              key={align}
              className="flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-hover-warm transition-colors"
            >
              <input
                type="radio"
                name="textAlign"
                value={align}
                checked={settings.textAlign === align}
                onChange={() => onUpdate({ textAlign: align })}
                className="w-4 h-4 text-forest-green focus:ring-forest-green focus:ring-2"
              />
              <span className="text-muted-gray-text capitalize">{align}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Margins
        </label>
        <div className="space-y-1">
          {(['small', 'medium', 'large'] as const).map((margin) => (
            <label
              key={margin}
              className="flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-hover-warm transition-colors"
            >
              <input
                type="radio"
                name="margins"
                value={margin}
                checked={settings.margins === margin}
                onChange={() => onUpdate({ margins: margin })}
                className="w-4 h-4 text-forest-green focus:ring-forest-green focus:ring-2"
              />
              <span className="text-muted-gray-text capitalize">{margin}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-3">
          Max Width: {settings.maxWidth}px
        </label>
        <input
          type="range"
          min="600"
          max="1200"
          step="50"
          value={settings.maxWidth}
          onChange={(e) => onUpdate({ maxWidth: Number(e.target.value) })}
          className="w-full h-2 bg-border-warm rounded-lg appearance-none cursor-pointer accent-forest-green"
        />
        <div className="flex justify-between text-xs text-light-gray-text mt-1">
          <span>600px</span>
          <span>1200px</span>
        </div>
      </div>
    </div>
  )
})


import { useCallback, useRef } from 'react'

export interface SelectionInfo {
  text: string
  x: number
  y: number
}

interface SelectionActionBarProps {
  selection: SelectionInfo | null
  onDismiss: () => void
}

export function SelectionActionBar({ selection, onDismiss }: SelectionActionBarProps) {
  const barRef = useRef<HTMLDivElement>(null)

  const handleCopy = useCallback(() => {
    if (selection?.text) {
      navigator.clipboard.writeText(selection.text)
      console.log('copy', selection.text)
      onDismiss()
    }
  }, [selection, onDismiss])

  const handleTranslate = useCallback(() => {
    if (selection?.text) {
      console.log('translate', selection.text)
    }
  }, [selection])

  const handleNewWord = useCallback(() => {
    if (selection?.text) {
      console.log('new_word', selection.text)
    }
  }, [selection])

  if (!selection) return null

  // Calculate bar position
  const barWidth = 180 // Approximate width of the bar
  const barHeight = 44 // Approximate height
  
  // Ensure bar stays within viewport
  let left = selection.x - barWidth / 2
  let top = selection.y - barHeight

  // Clamp to viewport bounds
  const padding = 8
  left = Math.max(padding, Math.min(left, window.innerWidth - barWidth - padding))
  top = Math.max(padding, top)

  return (
    <div
      ref={barRef}
      className="fixed z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-muted-gray-text shadow-lg"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translateY(-100%)',
      }}
    >
      <ActionButton icon="content_copy" label="Copy" onClick={handleCopy} />
      <ActionButton icon="translate" label="Translate" onClick={handleTranslate} />
      <ActionButton icon="bookmark_add" label="New Word" onClick={handleNewWord} />
    </div>
  )
}

interface ActionButtonProps {
  icon: string
  label: string
  onClick: () => void
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-9 h-9 rounded-md text-warm-off-white hover:bg-light-gray-text transition-colors"
      title={label}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
  )
}

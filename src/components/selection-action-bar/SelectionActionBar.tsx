import { useCallback, useRef, useState, useEffect } from 'react'
import { getWordDefinition } from '../../services/llmService'
import { useLLMTranslationSettings } from '../../hooks/useLLMSettings'
import { ActionButton } from './ActionButton'
import { TranslationPopup } from './TranslationPopup'
import type { SelectionInfo } from './types'

interface SelectionActionBarProps {
  selection: SelectionInfo | null
  onDismiss: () => void
}

export function SelectionActionBar({ selection, onDismiss }: SelectionActionBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const currentWordRef = useRef<string | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [definition, setDefinition] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const llmSettings = useLLMTranslationSettings()

  const handleCopy = useCallback(() => {
    if (selection?.text) {
      navigator.clipboard.writeText(selection.text)
      onDismiss()
    }
  }, [selection, onDismiss])

  const handleTranslate = useCallback(async () => {
    if (!selection?.text || !llmSettings) {
      return
    }

    const wordToTranslate = selection.text
    // Track the current word being translated
    currentWordRef.current = wordToTranslate

    // Always reset state when opening translation
    setShowTranslation(true)
    setIsLoading(true)
    setError(null)
    setDefinition(null)

    try {
      const def = await getWordDefinition(wordToTranslate, llmSettings)
      // Only update state if this is still the current word (prevent race conditions)
      if (currentWordRef.current === wordToTranslate) {
        setDefinition(def)
      }
    } catch (err) {
      // Only update error if this is still the current word
      if (currentWordRef.current === wordToTranslate) {
        setError(err instanceof Error ? err.message : 'Failed to get definition')
      }
    } finally {
      // Only update loading state if this is still the current word
      if (currentWordRef.current === wordToTranslate) {
        setIsLoading(false)
      }
    }
  }, [selection, llmSettings])

  const handleCloseTranslation = useCallback(() => {
    setShowTranslation(false)
    setDefinition(null)
    setError(null)
    setIsLoading(false)
    onDismiss()
  }, [onDismiss])

  // Reset translation state when selection changes
  useEffect(() => {
    // Reset all translation state when selection changes
    currentWordRef.current = null
    setShowTranslation(false)
    setDefinition(null)
    setError(null)
    setIsLoading(false)
  }, [selection?.text])

  const handleNewWord = useCallback(() => {
    if (selection?.text) {
      console.log('new_word', selection.text)
    }
  }, [selection])

  if (!selection) return null

  // Calculate popup position
  const popupWidth = showTranslation ? 280 : 180
  const popupHeight = showTranslation ? 120 : 44

  // Ensure popup stays within viewport
  const padding = 8
  let left = selection.x - popupWidth / 2
  let top = selection.y - popupHeight

  // Clamp to viewport bounds
  left = Math.max(padding, Math.min(left, window.innerWidth - popupWidth - padding))
  top = Math.max(padding, top)

  // Show translation popup
  if (showTranslation) {
    return (
      <TranslationPopup
        ref={barRef}
        word={selection.text}
        definition={definition}
        isLoading={isLoading}
        error={error}
        left={left}
        top={top}
        width={popupWidth}
        onClose={handleCloseTranslation}
      />
    )
  }

  // Show action bar
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


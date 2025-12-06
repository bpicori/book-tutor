import { useCallback, useState } from 'react'
import { useStore } from '../store/useStore'
import { generateChapterPreview, LLMServiceError } from '../services/llmService'
import { getBookTitle, getBookAuthor, extractTextFromDocument } from '../utils/bookHelpers'
import { useLLMSettings } from './useLLMSettings'

/**
 * Hook for managing chapter preview generation
 * Handles loading chapter content, generating previews, and error handling
 */
export function useChapterPreview(chapterHref: string, chapterLabel: string) {
  const {
    book,
    currentSectionIndex,
    chapterPreviews,
    previewLoading,
    setChapterPreview,
    setPreviewLoading,
    clearChapterPreview,
  } = useStore()

  const llmSettings = useLLMSettings()
  const [error, setError] = useState<string | null>(null)
  const preview = chapterPreviews[chapterHref]

  const generatePreview = useCallback(async () => {
    if (!llmSettings) {
      setError('Please configure your API key in Settings to generate previews.')
      return
    }

    setError(null)
    setPreviewLoading(true)

    const bookTitle = getBookTitle(book?.metadata)
    const bookAuthor = getBookAuthor(book?.metadata)

    try {
      // Load chapter content from the book sections
      let chapterContent = ''
      if (book?.sections && currentSectionIndex !== null && currentSectionIndex >= 0) {
        const section = book.sections[currentSectionIndex]
        if (section?.createDocument) {
          try {
            const doc = await section.createDocument()
            chapterContent = extractTextFromDocument(doc)
          } catch (docErr) {
            console.warn('Failed to load chapter content:', docErr)
          }
        }
      }

      // Provide a fallback message if no content loaded
      if (!chapterContent) {
        chapterContent = `[Chapter content could not be loaded. Please generate based on the chapter title "${chapterLabel}" and book context.]`
      }

      const generatedPreview = await generateChapterPreview(
        bookTitle,
        bookAuthor,
        chapterLabel,
        chapterContent,
        llmSettings
      )

      setChapterPreview(chapterHref, {
        ...generatedPreview,
        chapterHref,
        chapterLabel,
        generatedAt: Date.now(),
      })
    } catch (err) {
      if (err instanceof LLMServiceError) {
        setError(err.message)
      } else {
        setError('Failed to generate preview. Please try again.')
      }
    } finally {
      setPreviewLoading(false)
    }
  }, [
    book,
    chapterHref,
    chapterLabel,
    currentSectionIndex,
    llmSettings,
    setChapterPreview,
    setPreviewLoading,
  ])

  const refreshPreview = useCallback(() => {
    clearChapterPreview(chapterHref)
    generatePreview()
  }, [chapterHref, clearChapterPreview, generatePreview])

  return {
    preview,
    isLoading: previewLoading,
    error,
    generatePreview,
    refreshPreview,
  }
}


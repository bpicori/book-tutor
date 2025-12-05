import { memo, useCallback, useState } from 'react'
import { useStore } from '../../store/useStore'
import { generateChapterPreview, LLMServiceError } from '../../services/llmService'
import { getBookTitle, getBookAuthor, extractTextFromDocument } from '../../utils/bookHelpers'
import type { ChapterPreview } from '../../types'

// Skeleton loading component
const PreviewSkeleton = memo(function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-4 bg-border-warm rounded w-3/4" />
      <div className="h-4 bg-border-warm rounded w-1/2" />
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-border-warm rounded w-full" />
        <div className="h-3 bg-border-warm rounded w-5/6" />
        <div className="h-3 bg-border-warm rounded w-4/6" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-border-warm rounded w-full" />
        <div className="h-3 bg-border-warm rounded w-3/4" />
      </div>
    </div>
  )
})

// Preview section component
interface PreviewSectionProps {
  title: string
  icon: string
  children: React.ReactNode
}

const PreviewSection = memo(function PreviewSection({ title, icon, children }: PreviewSectionProps) {
  return (
    <div className="bg-hover-warm/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-forest-green text-lg">{icon}</span>
        <h4 className="text-muted-gray-text font-semibold text-sm uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  )
})

// Preview content component
interface PreviewContentProps {
  preview: ChapterPreview
}

const PreviewContent = memo(function PreviewContent({ preview }: PreviewContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Themes */}
      {preview.themes.length > 0 && (
        <PreviewSection title="Main Themes" icon="lightbulb">
          <ul className="space-y-1.5">
            {preview.themes.map((theme, idx) => (
              <li key={idx} className="text-muted-gray-text text-sm flex items-start gap-2">
                <span className="text-forest-green mt-1">•</span>
                <span>{theme}</span>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* Key Concepts */}
      {preview.keyConcepts.length > 0 && (
        <PreviewSection title="Key Concepts" icon="school">
          <ul className="space-y-1.5">
            {preview.keyConcepts.map((concept, idx) => (
              <li key={idx} className="text-muted-gray-text text-sm flex items-start gap-2">
                <span className="text-forest-green mt-1">•</span>
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* Tone & Style (Fiction) */}
      {preview.toneAndStyle && (
        <PreviewSection title="Tone & Style" icon="palette">
          <p className="text-muted-gray-text text-sm leading-relaxed">{preview.toneAndStyle}</p>
        </PreviewSection>
      )}

      {/* Characters */}
      {preview.characters && preview.characters.length > 0 && (
        <PreviewSection title="Characters to Watch" icon="groups">
          <ul className="space-y-1.5">
            {preview.characters.map((character, idx) => (
              <li key={idx} className="text-muted-gray-text text-sm flex items-start gap-2">
                <span className="text-forest-green mt-1">•</span>
                <span>{character}</span>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* Definitions */}
      {preview.definitions && preview.definitions.length > 0 && (
        <PreviewSection title="Terms to Know" icon="dictionary">
          <dl className="space-y-2">
            {preview.definitions.map((def, idx) => (
              <div key={idx} className="text-sm">
                <dt className="font-medium text-forest-green">{def.term}</dt>
                <dd className="text-muted-gray-text ml-4">{def.definition}</dd>
              </div>
            ))}
          </dl>
        </PreviewSection>
      )}

      {/* Guiding Questions */}
      {preview.guidingQuestions.length > 0 && (
        <div className="bg-active-green-light rounded-lg p-4 border border-forest-green/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-forest-green text-lg">help_outline</span>
            <h4 className="text-forest-green font-semibold text-sm uppercase tracking-wide">
              Questions to Consider
            </h4>
          </div>
          <ul className="space-y-2">
            {preview.guidingQuestions.map((question, idx) => (
              <li key={idx} className="text-muted-gray-text text-sm flex items-start gap-2">
                <span className="text-forest-green font-medium">{idx + 1}.</span>
                <span className="italic">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

// Empty state component
interface EmptyStateProps {
  chapterLabel: string
  onGenerate: () => void
  isLoading: boolean
}

const EmptyState = memo(function EmptyState({ chapterLabel, onGenerate, isLoading }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="bg-active-green-light rounded-full w-16 h-16 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-forest-green text-3xl">auto_awesome</span>
      </div>
      <h3 className="text-muted-gray-text font-semibold text-lg mb-2">
        Ready to Preview
      </h3>
      <p className="text-light-gray-text text-sm mb-6 max-w-xs">
        Generate a spoiler-free preview to orient yourself before reading{' '}
        <span className="font-medium text-muted-gray-text">"{chapterLabel}"</span>
      </p>
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="flex items-center gap-2 bg-forest-green text-white px-5 py-2.5 rounded-lg hover:bg-forest-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            <span>Generate Preview</span>
          </>
        )}
      </button>
    </div>
  )
})

export const PreviewTab = memo(function PreviewTab() {
  const {
    book,
    progress,
    currentTocHref,
    currentSectionIndex,
    chapterPreviews,
    previewLoading,
    settings,
    setChapterPreview,
    setPreviewLoading,
    clearChapterPreview,
  } = useStore()

  const [error, setError] = useState<string | null>(null)

  const chapterLabel = progress.tocLabel || 'Current Chapter'
  const chapterHref = currentTocHref || 'default'
  const preview = chapterPreviews[chapterHref]

  const handleGenerate = useCallback(async () => {
    if (!settings.llmApiKey) {
      setError('Please configure your API key in Settings to generate previews.')
      return
    }

    setError(null)
    setPreviewLoading(true)

    const bookTitle = getBookTitle(book?.metadata)
    const bookAuthor = getBookAuthor(book?.metadata)

    const llmSettings = {
      apiKey: settings.llmApiKey,
      baseUrl: settings.llmBaseUrl,
      model: settings.llmModel,
    }

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
  }, [book, chapterHref, chapterLabel, currentSectionIndex, settings, setChapterPreview, setPreviewLoading])

  const handleRefresh = useCallback(() => {
    clearChapterPreview(chapterHref)
    handleGenerate()
  }, [chapterHref, clearChapterPreview, handleGenerate])

  return (
    <div className="flex flex-col h-full">
      {/* Chapter indicator */}
      <div className="flex items-center justify-between px-4 py-3 bg-hover-warm/30 border-b border-border-warm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-forest-green text-lg shrink-0">menu_book</span>
          <span className="text-sm text-muted-gray-text font-medium truncate">{chapterLabel}</span>
        </div>
        {preview && !previewLoading && (
          <button
            onClick={handleRefresh}
            className="text-light-gray-text hover:text-forest-green transition-colors shrink-0"
            title="Regenerate preview"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {previewLoading ? (
          <PreviewSkeleton />
        ) : preview ? (
          <PreviewContent preview={preview} />
        ) : (
          <EmptyState
            chapterLabel={chapterLabel}
            onGenerate={handleGenerate}
            isLoading={previewLoading}
          />
        )}
      </div>
    </div>
  )
})


import { memo, useState, useMemo } from 'react'
import Markdown from 'react-markdown'
import { useStore } from '../../store/useStore'
import { Logo, IconButton } from '../../components/common'

const WORDS_PER_PAGE = 20

export const VocabularyPage = memo(function VocabularyPage() {
  const { words, removeWord, goToLibrary, toggleSettings } = useStore()
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(words.length / WORDS_PER_PAGE)
  const displayedWords = useMemo(() => {
    const start = (currentPage - 1) * WORDS_PER_PAGE
    return words.slice(start, start + WORDS_PER_PAGE)
  }, [words, currentPage])

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  return (
    <div className="min-h-screen bg-warm-off-white flex flex-col">
      <header className="sticky top-0 z-10 bg-warm-off-white/95 backdrop-blur-sm border-b border-border-warm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <IconButton icon="arrow_back" label="Back to Library" text="Library" onClick={goToLibrary} />
              <Logo size="sm" />
              <h1 className="text-xl font-bold text-muted-gray-text tracking-tight">Vocabulary</h1>
            </div>
            <IconButton icon="settings" label="Settings" onClick={() => toggleSettings()} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-light-gray-text">
            {words.length === 0 
              ? 'No words saved yet. Select text in a book and click "New Word" to add one.' 
              : `${words.length} saved word${words.length === 1 ? '' : 's'}`}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-1 rounded-full hover:bg-hover-warm disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <span className="material-symbols-outlined text-muted-gray-text">chevron_left</span>
              </button>
              <span className="text-sm text-muted-gray-text font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-1 rounded-full hover:bg-hover-warm disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <span className="material-symbols-outlined text-muted-gray-text">chevron_right</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {displayedWords.map((word) => (
            <div 
              key={word.id} 
              className="relative group p-6 rounded-xl bg-white border border-border-warm hover:border-forest-green/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-3">
                    <h3 className="text-xl font-serif font-bold text-forest-green">{word.word}</h3>
                    {word.bookTitle && (
                      <span className="text-xs text-light-gray-text truncate max-w-[300px]" title={word.bookTitle}>
                        from {word.bookTitle}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-muted-gray-text leading-relaxed prose prose-stone max-w-none">
                    <Markdown
                      components={{
                        p: ({ children }) => <>{children}</>,
                      }}
                    >
                      {word.definition}
                    </Markdown>
                  </div>
                  
                  <div className="mt-4 text-xs text-light-gray-text flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    Added {new Date(word.savedAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => removeWord(word.id)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 text-light-gray-text hover:text-red-600 hover:bg-red-50 rounded-lg transform translate-x-2 group-hover:translate-x-0"
                  title="Remove word"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-gray-text hover:bg-hover-warm disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Previous
            </button>
            <span className="text-sm text-light-gray-text">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-gray-text hover:bg-hover-warm disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              Next
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
})

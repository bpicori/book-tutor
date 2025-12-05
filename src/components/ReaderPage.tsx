import { useRef, useCallback, useEffect, useState } from 'react'
import { useStore, type FoliateView } from '../store/useStore'
import { getBookFile } from '../store/bookStorage'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Reader } from './Reader'
import { Footer } from './Footer'
import { AISidebar } from './AISidebar'

export function ReaderPage() {
  const viewRef = useRef<FoliateView | null>(null)
  const { 
    currentBookId, 
    setBook, 
    setCoverUrl, 
    updateBookProgress,
    progress 
  } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadAttemptedRef = useRef(false)

  const handleNavigate = useCallback((href: string) => {
    viewRef.current?.goTo(href)
  }, [])

  const handlePrev = useCallback(() => {
    viewRef.current?.prev()
  }, [])

  const handleNext = useCallback(() => {
    viewRef.current?.next()
  }, [])

  const openBookFile = useCallback(
    async (file: File) => {
      const view = viewRef.current
      if (!view) {
        console.error('View not ready')
        return false
      }

      try {
        await view.open(file)

        const book = view.book || null
        setBook(book)

        // Load cover image
        if (book?.getCover) {
          try {
            const blob = await book.getCover()
            if (blob) {
              const url = URL.createObjectURL(blob)
              setCoverUrl(url)
            }
          } catch (err) {
            console.error('Failed to load cover:', err)
          }
        }

        // Update document title
        if (book?.metadata?.title) {
          const title = typeof book.metadata.title === 'string' 
            ? book.metadata.title 
            : Object.values(book.metadata.title)[0]
          document.title = `${title} - Read with AI`
        }

        await view.init({ lastLocation: undefined, showTextStart: true })
        setIsLoading(false)
        return true
      } catch (err) {
        console.error('Failed to open book:', err)
        setError('Failed to open book')
        setIsLoading(false)
        return false
      }
    },
    [setBook, setCoverUrl]
  )

  // Load book from IndexedDB on mount
  useEffect(() => {
    // Only attempt to load once
    if (loadAttemptedRef.current) return
    loadAttemptedRef.current = true

    async function loadBook() {
      if (!currentBookId) {
        setError('No book selected')
        setIsLoading(false)
        return
      }

      try {
        const file = await getBookFile(currentBookId)
        if (!file) {
          setError('Book file not found')
          setIsLoading(false)
          return
        }

        // Wait for the view to be ready with a promise-based approach
        let attempts = 0
        const maxAttempts = 100 // 5 seconds at 50ms intervals
        
        const waitForView = () => {
          return new Promise<boolean>((resolve) => {
            const checkView = () => {
              attempts++
              if (viewRef.current) {
                resolve(true)
              } else if (attempts >= maxAttempts) {
                resolve(false)
              } else {
                setTimeout(checkView, 50)
              }
            }
            checkView()
          })
        }

        const viewReady = await waitForView()
        if (!viewReady) {
          setError('Failed to initialize reader')
          setIsLoading(false)
          return
        }

        await openBookFile(file)
      } catch (err) {
        console.error('Failed to load book:', err)
        setError('Failed to load book from storage')
        setIsLoading(false)
      }
    }

    loadBook()
  }, [currentBookId, openBookFile])

  // Update book progress in library when reading
  useEffect(() => {
    if (currentBookId && progress.fraction > 0) {
      updateBookProgress(currentBookId, progress.fraction)
    }
  }, [currentBookId, progress.fraction, updateBookProgress])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'ArrowLeft') {
        viewRef.current?.goLeft()
      } else if (e.key === 'ArrowRight') {
        viewRef.current?.goRight()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-warm-off-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-light-gray-text mb-4">
            error
          </span>
          <p className="text-muted-gray-text">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-warm-off-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-forest-green border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-gray-text">Loading book...</span>
          </div>
        </div>
      )}
      
      <Sidebar onNavigate={handleNavigate} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onPrev={handlePrev} onNext={handleNext} />
        <Reader viewRef={viewRef} />
        <Footer />
      </main>

      <AISidebar />
    </div>
  )
}

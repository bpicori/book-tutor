import { useRef, useCallback, useEffect } from 'react'
import { useStore, type FoliateView } from './store/useStore'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Reader } from './components/Reader'
import { Footer } from './components/Footer'
import { AISidebar } from './components/AISidebar'

export function App() {
  const viewRef = useRef<FoliateView | null>(null)
  const { setBook, setCoverUrl } = useStore()

  const handleNavigate = useCallback((href: string) => {
    viewRef.current?.goTo(href)
  }, [])

  const handlePrev = useCallback(() => {
    viewRef.current?.prev()
  }, [])

  const handleNext = useCallback(() => {
    viewRef.current?.next()
  }, [])

  const handleFileSelect = useCallback(
    async (file: File) => {
      const view = viewRef.current
      if (!view) return

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
          document.title = `${book.metadata.title} - Read with AI`
        }

        await view.init({ lastLocation: undefined, showTextStart: true })
      } catch (err) {
        console.error('Failed to open book:', err)
      }
    },
    [setBook, setCoverUrl]
  )

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

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar onNavigate={handleNavigate} onFileSelect={handleFileSelect} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onPrev={handlePrev} onNext={handleNext} />
        <Reader viewRef={viewRef} />
        <Footer />
      </main>

      <AISidebar />
    </div>
  )
}


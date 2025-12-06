import { useRef, useCallback, useEffect } from "react"
import type { FoliateView } from "../../types"
import { useStore } from "../../store/useStore"
import { useBookLoader } from "../../hooks/useBookLoader"
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation"
import { LoadingSpinner } from "../../components/common"
import { Sidebar, Header, Reader, Footer } from "../../components/reader"
import { AISidebar } from "../../components/chat"

export function ReaderPage() {
  const viewRef = useRef<FoliateView | null>(null)
  const { currentBookId, updateBookProgress, updateBookLocation, progress } =
    useStore()
  const { isLoading, error } = useBookLoader(viewRef)

  useKeyboardNavigation(viewRef)

  const handleNavigate = useCallback(
    (href: string) => viewRef.current?.goTo(href),
    [],
  )
  const handlePrev = useCallback(() => viewRef.current?.prev(), [])
  const handleNext = useCallback(() => viewRef.current?.next(), [])

  // Update progress in library
  useEffect(() => {
    if (currentBookId && progress.fraction > 0) {
      updateBookProgress(currentBookId, progress.fraction)
    }
  }, [currentBookId, progress.fraction, updateBookProgress])

  // Save reading location for restoring on refresh
  useEffect(() => {
    if (currentBookId && progress.cfi) {
      updateBookLocation(currentBookId, progress.cfi)
    }
  }, [currentBookId, progress.cfi, updateBookLocation])

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
      {isLoading && <LoadingSpinner message="Loading book..." fullScreen />}
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

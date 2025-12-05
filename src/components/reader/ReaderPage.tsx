import { useRef, useCallback, useEffect } from 'react'
import type { FoliateView } from '../../types'
import { useStore } from '../../store/useStore'
import { useBookLoader } from '../../hooks/useBookLoader'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import { LoadingSpinner } from '../common'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Reader } from './Reader'
import { Footer } from './Footer'
import { AISidebar } from '../chat/AISidebar'

export function ReaderPage() {
  const viewRef = useRef<FoliateView | null>(null)
  const { currentBookId, updateBookProgress, progress } = useStore()
  const { isLoading, error } = useBookLoader(viewRef)

  useKeyboardNavigation(viewRef)

  const handleNavigate = useCallback((href: string) => viewRef.current?.goTo(href), [])
  const handlePrev = useCallback(() => viewRef.current?.prev(), [])
  const handleNext = useCallback(() => viewRef.current?.next(), [])

  // Update progress in library
  useEffect(() => {
    if (currentBookId && progress.fraction > 0) {
      updateBookProgress(currentBookId, progress.fraction)
    }
  }, [currentBookId, progress.fraction, updateBookProgress])

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-warm-off-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-light-gray-text mb-4">error</span>
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


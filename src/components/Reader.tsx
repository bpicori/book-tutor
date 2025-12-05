import { useEffect, useRef, useCallback } from 'react'
import { useStore, type FoliateView } from '../store/useStore'
import '../foliate-js/view.js'

interface ReaderProps {
  viewRef: React.MutableRefObject<FoliateView | null>
}

export function Reader({ viewRef }: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setProgress, setCurrentTocHref } = useStore()

  // Handle reading progress updates when user navigates the book
  const handleRelocate = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent
      const { fraction, tocItem } = customEvent.detail

      setProgress({
        fraction,
        tocLabel: tocItem?.label,
      })
      
      // Update the current chapter highlight when navigating
      if (tocItem?.href) {
        setCurrentTocHref(tocItem.href)
      }
    },
    [setProgress, setCurrentTocHref]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create and configure the book reader view
    const view = document.createElement('foliate-view') as FoliateView
    view.style.width = '100%'
    view.style.height = '100%'

    // Mount the view and store reference
    container.appendChild(view)
    viewRef.current = view

    // Listen for navigation events to track reading progress
    view.addEventListener('relocate', handleRelocate)

    // Cleanup: remove event listener and view element
    return () => {
      view.removeEventListener('relocate', handleRelocate)
      view.remove()
      viewRef.current = null
    }
  }, [handleRelocate, viewRef])

  return <div ref={containerRef} className="flex-1 overflow-hidden bg-sepia-panel" />
}


import { useEffect, useRef, useCallback } from 'react'
import { useStore, type FoliateView } from '../store/useStore'
import '../foliate-js/view.js'

interface ReaderProps {
  viewRef: React.MutableRefObject<FoliateView | null>
}

export function Reader({ viewRef }: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setProgress } = useStore()

  const handleRelocate = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent).detail
      const { fraction, tocItem } = detail
      setProgress({
        fraction,
        tocLabel: tocItem?.label,
      })
    },
    [setProgress]
  )

  useEffect(() => {
    if (!containerRef.current) return

    // Create the foliate-view element
    const view = document.createElement('foliate-view') as FoliateView
    view.style.width = '100%'
    view.style.height = '100%'

    containerRef.current.appendChild(view)
    viewRef.current = view

    // Add event listeners
    view.addEventListener('relocate', handleRelocate)

    return () => {
      view.removeEventListener('relocate', handleRelocate)
      view.remove()
      viewRef.current = null
    }
  }, [handleRelocate, viewRef])

  return <div ref={containerRef} className="flex-1 overflow-hidden bg-sepia-panel" />
}


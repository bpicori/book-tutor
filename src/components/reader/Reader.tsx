import { useEffect, useRef, useCallback } from 'react'
import type { FoliateView } from '../../types'
import { useStore } from '../../store/useStore'
import '../../foliate-js/view.js'

interface ReaderProps {
  viewRef: React.MutableRefObject<FoliateView | null>
}

export function Reader({ viewRef }: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setProgress, setCurrentTocHref } = useStore()

  const handleRelocate = useCallback((event: Event) => {
    const { fraction, tocItem } = (event as CustomEvent).detail
    setProgress({ fraction, tocLabel: tocItem?.label })
    if (tocItem?.href) setCurrentTocHref(tocItem.href)
  }, [setProgress, setCurrentTocHref])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const view = document.createElement('foliate-view') as FoliateView
    view.style.width = '100%'
    view.style.height = '100%'

    container.appendChild(view)
    viewRef.current = view
    view.addEventListener('relocate', handleRelocate)

    return () => {
      view.removeEventListener('relocate', handleRelocate)
      view.remove()
      viewRef.current = null
    }
  }, [handleRelocate, viewRef])

  return <div ref={containerRef} className="flex-1 overflow-hidden bg-sepia-panel" />
}


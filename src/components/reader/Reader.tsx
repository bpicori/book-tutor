import { useEffect, useRef, useCallback, useState } from 'react'
import type { FoliateView } from '../../types'
import { useStore } from '../../store/useStore'
import { generateReaderCSS } from '../../utils/readerStyles'
import { SelectionActionBar, type SelectionInfo } from './SelectionActionBar'
import '../../foliate-js/view.js'

interface ReaderProps {
  viewRef: React.MutableRefObject<FoliateView | null>
}

export function Reader({ viewRef }: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setProgress, setCurrentTocHref, setCurrentSectionIndex, settings } = useStore()
  const [selection, setSelection] = useState<SelectionInfo | null>(null)

  const handleRelocate = useCallback((event: Event) => {
    const { fraction, tocItem, section } = (event as CustomEvent).detail
    setProgress({ fraction, tocLabel: tocItem?.label })
    if (tocItem?.href) setCurrentTocHref(tocItem.href)
    // Section index is in section.current from the progress object
    if (typeof section?.current === 'number') setCurrentSectionIndex(section.current)
  }, [setProgress, setCurrentTocHref, setCurrentSectionIndex])

  const handleDismissSelection = useCallback(() => {
    setSelection(null)
  }, [])

  // Apply font settings when they change
  useEffect(() => {
    const view = viewRef.current
    if (!view?.book || !view.renderer) return

    const css = generateReaderCSS(settings)
    view.renderer.setStyles?.(css)
  }, [settings, viewRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const view = document.createElement('foliate-view') as FoliateView
    view.style.width = '100%'
    view.style.height = '100%'

    container.appendChild(view)
    viewRef.current = view
    view.addEventListener('relocate', handleRelocate)

    const documentListeners: Array<{ doc: Document; cleanup: () => void }> = []

    const setupDocumentListeners = (doc: Document) => {
      const handleMouseUp = (e: MouseEvent) => {
        setTimeout(() => {
          const sel = doc.getSelection()
          
          if (!sel || sel.isCollapsed || !sel.toString().trim()) {
            return
          }
          
          const text = sel.toString().trim()
          if (!text) return
          
          // Get selection range
          const range = sel.getRangeAt(0)
          const rects = range.getClientRects()
          
          // Find the iframe element to get its position in the main viewport
          const iframe = doc.defaultView?.frameElement as HTMLElement | null
          const iframeRect = iframe?.getBoundingClientRect()
          
          let x: number
          let y: number
          
          if (rects.length > 0 && iframeRect) {
            // Use the first rect of the selection for positioning
            const firstRect = rects[0]
            // Add iframe's position to get main viewport coordinates
            x = iframeRect.left + firstRect.left + firstRect.width / 2
            // Position closer to the selection (add small offset to reduce gap)
            y = iframeRect.top + firstRect.top + 8
          } else if (iframeRect) {
            // Fallback to mouse position within iframe + iframe offset
            x = iframeRect.left + e.clientX
            y = iframeRect.top + e.clientY - 50
          } else {
            // Last resort: use container position
            const containerRect = container.getBoundingClientRect()
            x = containerRect.left + e.clientX
            y = containerRect.top + e.clientY - 50
          }
          
          setSelection({ text, x, y })
        }, 20)
      }

      // Dismiss selection bar when clicking inside the document (without selecting)
      const handleMouseDown = () => {
        setTimeout(() => {
          const sel = doc.getSelection()
          if (!sel || sel.isCollapsed || !sel.toString().trim()) {
            setSelection(null)
          }
        }, 10)
      }

      doc.addEventListener('mouseup', handleMouseUp)
      doc.addEventListener('mousedown', handleMouseDown)
      
      const cleanup = () => {
        doc.removeEventListener('mouseup', handleMouseUp)
        doc.removeEventListener('mousedown', handleMouseDown)
      }
      
      documentListeners.push({ doc, cleanup })
    }

    // Handle when new documents load
    const handleLoad = (event: Event) => {
      const { doc } = (event as CustomEvent).detail
      if (doc) {
        setupDocumentListeners(doc)
      }
    }

    view.addEventListener('load', handleLoad)

    // Handle clicks outside to dismiss selection bar (for clicks outside iframe)
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const selectionBar = document.querySelector('[data-selection-bar]')
      if (selectionBar?.contains(target)) {
        return
      }
      
      setSelection(null)
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      view.removeEventListener('relocate', handleRelocate)
      view.removeEventListener('load', handleLoad)
      document.removeEventListener('mousedown', handleClickOutside)
      for (const { cleanup } of documentListeners) {
        cleanup()
      }
      view.remove()
      viewRef.current = null
    }
  }, [handleRelocate, viewRef])

  return (
    <>
      <div ref={containerRef} className="flex-1 overflow-hidden bg-sepia-panel" />
      <div data-selection-bar>
        <SelectionActionBar selection={selection} onDismiss={handleDismissSelection} />
      </div>
    </>
  )
}

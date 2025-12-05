import { useRef, useCallback, useEffect, useState } from 'react'
import type { FoliateView } from '../types'
import { useStore } from '../store/useStore'
import { getBookFile } from '../store/bookStorage'
import { generateReaderCSS } from '../utils/readerStyles'

export function useBookLoader(viewRef: React.MutableRefObject<FoliateView | null>) {
  const { currentBookId, setBook, setCoverUrl, settings } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadAttemptedRef = useRef(false)

  const openBookFile = useCallback(async (file: File) => {
    const view = viewRef.current
    if (!view) return false

    try {
      await view.open(file)
      const book = view.book || null
      setBook(book)

      // Load cover image
      if (book?.getCover) {
        try {
          const blob = await book.getCover()
          if (blob) setCoverUrl(URL.createObjectURL(blob))
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
      
      // Apply font settings after book is initialized
      if (view.renderer) {
        const css = generateReaderCSS(settings)
        view.renderer.setStyles?.(css)
      }
      
      setIsLoading(false)
      return true
    } catch (err) {
      console.error('Failed to open book:', err)
      setError('Failed to open book')
      setIsLoading(false)
      return false
    }
  }, [setBook, setCoverUrl, viewRef, settings])

  useEffect(() => {
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

        // Wait for view to be ready
        let attempts = 0
        while (!viewRef.current && attempts < 100) {
          await new Promise(r => setTimeout(r, 50))
          attempts++
        }

        if (!viewRef.current) {
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
  }, [currentBookId, openBookFile, viewRef])

  return { isLoading, error }
}


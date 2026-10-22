import { useRef, useCallback, useEffect, useState } from "react";
import type { FoliateView } from "../types";
import { useStore } from "../store/useStore";
import { useBookFile } from "./useBookFile";
import {
  loadBookCover,
  updateBookTitle,
  applyBookStyles,
} from "../utils/bookOpeners";

/**
 * Hook for loading and opening a book in the foliate view
 * Orchestrates file loading, book opening, cover loading, title updates, and style application
 */
export function useBookLoader(
  viewRef: React.MutableRefObject<FoliateView | null>,
  bookIdOverride?: string | null
) {
  const {
    currentBookId: storeBookId,
    setBook,
    setCoverUrl,
    settings,
    library,
  } = useStore();
  const currentBookId = bookIdOverride ?? storeBookId;

  // Get the saved location for the current book
  const currentBook = library.find((b) => b.id === currentBookId);
  const savedLocation = currentBook?.lastLocation || undefined;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadAttemptedRef = useRef<string | null>(null);
  const { loadBookFile } = useBookFile();

  const openBookFile = useCallback(
    async (file: File, lastLocation?: string) => {
      const view = viewRef.current;
      if (!view) return false;

      try {
        // Open book in foliate view
        await view.open(file);
        const book = view.book || null;
        setBook(book);

        // Load cover image (non-blocking)
        loadBookCover(book, setCoverUrl);

        // Update document title
        updateBookTitle(book);

        // Initialize view with saved location if available
        await view.init({ lastLocation, showTextStart: !lastLocation });

        // Apply styles after initialization
        applyBookStyles(view.renderer || null, settings);

        setIsLoading(false);
        return true;
      } catch (err) {
        console.error("Failed to open book:", err);
        setError("Failed to open book");
        setIsLoading(false);
        return false;
      }
    },
    [setBook, setCoverUrl, viewRef, settings]
  );

  useEffect(() => {
    if (!currentBookId) {
      setError("No book selected");
      setIsLoading(false);
      return;
    }
    if (loadAttemptedRef.current === currentBookId) return;
    loadAttemptedRef.current = currentBookId;
    setIsLoading(true);
    setError(null);
    const bookId = currentBookId;

    async function loadBook() {
      // Load file from storage
      const file = await loadBookFile(bookId);
      if (!file) {
        setError("Book file not found");
        setIsLoading(false);
        return;
      }

      // Wait for view to be ready
      let attempts = 0;
      while (!viewRef.current && attempts < 100) {
        await new Promise((r) => setTimeout(r, 50));
        attempts++;
      }

      if (!viewRef.current) {
        setError("Failed to initialize reader");
        setIsLoading(false);
        return;
      }

      await openBookFile(file, savedLocation);
    }

    loadBook();
  }, [currentBookId, loadBookFile, openBookFile, viewRef, savedLocation]);

  return { isLoading, error };
}

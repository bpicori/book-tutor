import { useCallback, useState } from "react";
import { useStore } from "../store/useStore";
import { SAMPLE_BOOK, SAMPLE_BOOK_ID } from "../demo";
import { useAddBook } from "./useAddBook";
import type { LibraryBook } from "../types";

/**
 * Loads the bundled sample book into the library.
 *
 * It is stored exactly like a book added from disk, so reading, progress and
 * highlights behave the same. Loading twice reuses the existing entry.
 */
export function useSampleBook() {
  const library = useStore((state) => state.library);
  const { inspectBook, commitBook } = useAddBook();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSampleBook = useCallback(async (): Promise<LibraryBook | null> => {
    const existing = library.find((book) => book.id === SAMPLE_BOOK_ID);
    if (existing) return existing;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(SAMPLE_BOOK.url);
      if (!response.ok)
        throw new Error(`Sample book fetch failed: ${response.status}`);

      const blob = await response.blob();
      const file = new File([blob], SAMPLE_BOOK.fileName, {
        type: "application/epub+zip",
      });

      const draft = await inspectBook(file);
      if (!draft) throw new Error("Sample book could not be read");

      const book = await commitBook(draft, {
        id: SAMPLE_BOOK_ID,
        title: SAMPLE_BOOK.title,
        author: SAMPLE_BOOK.author,
      });
      if (!book) throw new Error("Sample book could not be saved");

      return book;
    } catch (loadError) {
      console.error("Failed to load the sample book:", loadError);
      setError(
        "Could not load the sample book. Check your connection and try again."
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [commitBook, inspectBook, library]);

  return { loadSampleBook, isLoading, error };
}

import { useState, useCallback } from "react";
import { getBookFile } from "../store/bookStorage";

/**
 * Hook for loading a book file from IndexedDB storage
 */
export function useBookFile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookFile = useCallback(
    async (bookId: string): Promise<File | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const file = await getBookFile(bookId);
        if (!file) {
          setError("Book file not found");
          setIsLoading(false);
          return null;
        }
        setIsLoading(false);
        return file;
      } catch (err) {
        console.error("Failed to load book file:", err);
        setError("Failed to load book from storage");
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  return { loadBookFile, isLoading, error };
}

import { useState, useCallback } from "react";
import { getBookFile } from "../store/bookStorage";

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
          return null;
        }
        return file;
      } catch (err) {
        console.error("Failed to load book file:", err);
        setError("Failed to load book from storage");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { loadBookFile, isLoading, error };
}

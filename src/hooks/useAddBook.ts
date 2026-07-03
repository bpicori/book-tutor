import { useCallback, useState } from "react";
import type { LibraryBook } from "../types";
import { useStore } from "../store/useStore";
import { saveBookFile } from "../store/bookStorage";
import { blobToDataUrl, generateBookId } from "../utils/formatters";
import {
  getBookAuthor,
  getBookTitle,
  getTitleFromFilename,
} from "../utils/metadata";

type FoliateImportView = HTMLElement & {
  book?: {
    metadata?: { title?: unknown; author?: unknown };
    getCover?(): Promise<Blob | null>;
  };
  open(file: File): Promise<void>;
};

export function useAddBook() {
  const { addBookToLibrary } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const addBook = useCallback(
    async (file: File) => {
      setIsLoading(true);

      try {
        const view = document.createElement(
          "foliate-view"
        ) as FoliateImportView;
        view.style.cssText =
          "position:absolute;left:-9999px;width:1px;height:1px";
        document.body.appendChild(view);

        await view.open(file);
        const book = view.book;

        const title =
          getBookTitle(book?.metadata, getTitleFromFilename(file.name)) ||
          getTitleFromFilename(file.name);
        const author = getBookAuthor(book?.metadata, "");

        let coverDataUrl: string | null = null;
        if (book?.getCover) {
          try {
            const blob = await book.getCover();
            if (blob) coverDataUrl = await blobToDataUrl(blob);
          } catch (err) {
            console.error("Failed to load cover:", err);
          }
        }

        view.remove();

        const id = generateBookId();
        await saveBookFile(id, file);

        const libraryBook: LibraryBook = {
          id,
          title,
          author,
          coverDataUrl,
          addedAt: Date.now(),
          lastReadAt: null,
          progress: 0,
          lastLocation: null,
        };
        addBookToLibrary(libraryBook);
      } catch (err) {
        console.error("Failed to add book:", err);
        alert("Failed to add book. Please make sure it's a valid EPUB file.");
      } finally {
        setIsLoading(false);
      }
    },
    [addBookToLibrary]
  );

  return { addBook, isLoading };
}

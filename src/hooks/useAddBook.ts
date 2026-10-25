import { useCallback, useRef, useState } from "react";
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
    metadata?: {
      title?: unknown;
      author?: unknown;
    };
    getCover?(): Promise<Blob | null>;
  };
  open(file: File): Promise<void>;
};

export interface BookDraft {
  file: File;
  title: string;
  author: string;
  coverDataUrl: string | null;
}

export function isEpubFile(file: File): boolean {
  return /\.epub$/i.test(file.name) || file.type === "application/epub+zip";
}

interface CommitOverrides {
  title?: string;
  author?: string;
  /** Forces the book id (used by the bundled sample book). */
  id?: string;
}

/**
 * Two-step book import. `inspectBook` reads the metadata and cover without
 * saving anything, so the add dialog can show real title/author fields.
 * `commitBook` stores the file and adds the library entry.
 */
export function useAddBook() {
  const addBookToLibrary = useStore((state) => state.addBookToLibrary);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inspectToken = useRef(0);

  const inspectBook = useCallback(
    async (file: File): Promise<BookDraft | null> => {
      setError(null);

      if (!isEpubFile(file)) {
        setError("Choose an EPUB file. Other formats are not supported.");
        return null;
      }

      const token = ++inspectToken.current;
      setIsInspecting(true);

      const view = document.createElement("foliate-view") as FoliateImportView;
      view.style.cssText =
        "position:absolute;left:-9999px;width:1px;height:1px";
      document.body.appendChild(view);

      try {
        await view.open(file);
        if (token !== inspectToken.current) return null;

        const book = view.book;
        const fallbackTitle = getTitleFromFilename(file.name);
        const title =
          getBookTitle(book?.metadata, fallbackTitle) || fallbackTitle;
        const author = getBookAuthor(book?.metadata, "");

        let coverDataUrl: string | null = null;
        if (book?.getCover) {
          try {
            const blob = await book.getCover();
            if (blob) coverDataUrl = await blobToDataUrl(blob);
          } catch (coverError) {
            console.error("Failed to load cover:", coverError);
          }
        }

        return {
          file,
          title,
          author,
          coverDataUrl,
        };
      } catch (err) {
        console.error("Failed to inspect book:", err);
        if (token === inspectToken.current) {
          setError(
            "Could not read this EPUB. Make sure the file is a valid EPUB and try again."
          );
        }
        return null;
      } finally {
        view.remove();
        if (token === inspectToken.current) setIsInspecting(false);
      }
    },
    []
  );

  const commitBook = useCallback(
    async (
      draft: BookDraft,
      overrides: CommitOverrides = {}
    ): Promise<LibraryBook | null> => {
      setError(null);
      setIsAdding(true);

      try {
        const id = overrides.id ?? generateBookId();
        await saveBookFile(id, draft.file);

        const book: LibraryBook = {
          id,
          title: overrides.title?.trim() || draft.title,
          author: overrides.author?.trim() || draft.author || "Unknown Author",
          coverDataUrl: draft.coverDataUrl,
          addedAt: Date.now(),
          lastReadAt: null,
          progress: 0,
          lastLocation: null,
        };

        addBookToLibrary(book);
        return book;
      } catch (err) {
        console.error("Failed to add book:", err);
        setError("Failed to save this book. Check your browser storage.");
        return null;
      } finally {
        setIsAdding(false);
      }
    },
    [addBookToLibrary]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    inspectBook,
    commitBook,
    isInspecting,
    isAdding,
    error,
    clearError,
  };
}

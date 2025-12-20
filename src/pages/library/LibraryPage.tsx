import { useCallback, useMemo, useState } from "react";
import type { LibraryBook } from "../../types";
import { useStore } from "../../store/useStore";
import { saveBookFile, deleteBookFile } from "../../store/bookStorage";
import {
  formatLanguageMap,
  formatContributor,
  blobToDataUrl,
  generateBookId,
} from "../../utils/formatters";
import { LoadingSpinner, Logo, IconButton } from "../../components/common";
import { BookCard, AddBookCard } from "../../components/library";

export function LibraryPage() {
  const {
    library,
    addBookToLibrary,
    removeBookFromLibrary,
    openBook,
    toggleSettings,
    goToVocabulary,
  } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const sortedLibrary = useMemo(
    () =>
      [...library].sort((a, b) => {
        if (a.lastReadAt && b.lastReadAt) return b.lastReadAt - a.lastReadAt;
        if (a.lastReadAt) return -1;
        if (b.lastReadAt) return 1;
        return b.addedAt - a.addedAt;
      }),
    [library]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setIsLoading(true);

      try {
        // Create temporary view to extract metadata
        const view = document.createElement("foliate-view") as HTMLElement & {
          book?: {
            metadata?: { title?: unknown; author?: unknown };
            getCover?(): Promise<Blob | null>;
          };
          open(file: File): Promise<void>;
        };
        view.style.cssText =
          "position:absolute;left:-9999px;width:1px;height:1px";
        document.body.appendChild(view);

        await view.open(file);
        const book = view.book;

        // Type checks and safe formatting to address type safety and injection risk
        let rawTitle: unknown = book?.metadata?.title;
        let rawAuthor: unknown = book?.metadata?.author;

        const safeTitle =
          typeof rawTitle === "string" ||
          (typeof rawTitle === "object" && rawTitle !== null)
            ? formatLanguageMap(rawTitle as any)
            : "";
        const title = safeTitle || file.name.replace(".epub", "");

        const safeAuthor =
          typeof rawAuthor === "string" ||
          Array.isArray(rawAuthor) ||
          typeof rawAuthor === "object"
            ? formatContributor(rawAuthor as any)
            : "";
        const author = safeAuthor || "";

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

  const handleDeleteBook = useCallback(
    async (bookId: string) => {
      if (
        confirm("Are you sure you want to remove this book from your library?")
      ) {
        await deleteBookFile(bookId);
        removeBookFromLibrary(bookId);
      }
    },
    [removeBookFromLibrary]
  );

  return (
    <div className="min-h-screen bg-warm-off-white">
      <header className="sticky top-0 z-10 bg-warm-off-white/95 backdrop-blur-sm border-b border-border-warm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Logo />
              <h1 className="text-lg md:text-2xl font-bold text-muted-gray-text tracking-tight truncate">
                Read with AI
              </h1>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <IconButton
                icon="book_2"
                label="Vocabulary"
                onClick={goToVocabulary}
              />
              <IconButton
                icon="settings"
                label="Settings"
                onClick={() => toggleSettings()}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-muted-gray-text mb-1">
            Your Library
          </h2>
          <p className="text-light-gray-text text-sm">
            {library.length === 0
              ? "Add your first book to get started"
              : `${library.length} book${library.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {isLoading && <LoadingSpinner message="Adding book..." />}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          <AddBookCard onFileSelect={handleFileSelect} />
          {sortedLibrary.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpen={() => openBook(book.id)}
              onDelete={() => handleDeleteBook(book.id)}
            />
          ))}
        </div>

        {library.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-6xl text-border-warm mb-4">
              library_books
            </span>
            <h3 className="text-muted-gray-text font-medium mb-2">
              Your library is empty
            </h3>
            <p className="text-light-gray-text text-sm max-w-md mx-auto">
              Click the "Add Book" card above to add your first EPUB file.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

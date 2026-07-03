import { useCallback, useMemo } from "react";
import { useStore } from "../../store/useStore";
import { useNavigation } from "../../hooks/useNavigation";
import { deleteBookFile } from "../../store/bookStorage";
import { useAddBook } from "../../hooks/useAddBook";
import { LoadingSpinner, IconButton } from "../../components/common";
import { PageShell } from "../../components/layout/PageShell";
import { BookCard, AddBookCard } from "../../components/library";

export function LibraryPage() {
  const { library, removeBookFromLibrary } = useStore();
  const { openBook, goToVocabulary, goToSettings } = useNavigation();
  const { addBook, isLoading } = useAddBook();

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

  const isEmpty = library.length === 0;

  return (
    <PageShell
      variant="home"
      actions={
        <>
          <IconButton
            icon="book_2"
            label="Vocabulary"
            onClick={goToVocabulary}
          />
          <IconButton icon="settings" label="Settings" onClick={goToSettings} />
        </>
      }
    >
      {isLoading && <LoadingSpinner message="Adding book..." />}

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center py-8 md:py-12">
          <div className="w-full max-w-lg mx-auto text-center">
            <div className="mb-8 space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-forest-green/10">
                <span className="material-symbols-outlined text-4xl text-forest-green/70">
                  auto_stories
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-muted-gray-text">
                Your library is empty
              </h2>
              <p className="text-light-gray-text text-sm md:text-base max-w-sm mx-auto leading-relaxed">
                Add an EPUB to start reading with chapter previews, highlights,
                and AI help along the way.
              </p>
            </div>

            <AddBookCard variant="hero" onFileSelect={addBook} />

            <p className="mt-6 text-xs text-light-gray-text">
              EPUB files only · stored locally in your browser
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-muted-gray-text mb-1">
              Your Library
            </h2>
            <p className="text-light-gray-text text-sm">
              {library.length} book{library.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            <AddBookCard onFileSelect={addBook} />
            {sortedLibrary.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onOpen={() => openBook(book.id)}
                onDelete={() => handleDeleteBook(book.id)}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

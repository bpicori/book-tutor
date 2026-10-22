import { useCallback, useMemo, useState } from "react";
import { useStore } from "../../store/useStore";
import { useNavigation } from "../../hooks/useNavigation";
import { deleteBookFile } from "../../store/bookStorage";
import { removeSpeechForBook } from "../../services/speechStore";
import { APP_DISPLAY_NAME } from "../../constants";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Page } from "../../components/layout/Page";
import { useToast } from "../../components/ui/Toast";
import { LibraryHero } from "../../components/library/LibraryHero";
import { LibraryRow } from "../../components/library/LibraryRow";
import {
  LibraryToolbar,
  type LibraryFilter,
} from "../../components/library/LibraryToolbar";
import { AddBookDialog } from "../../components/library/AddBookDialog";
import { BookDetailDialog } from "../../components/library/BookDetailDialog";
import type { LibraryBook } from "../../types";

export function LibraryPage() {
  const library = useStore((state) => state.library);
  const words = useStore((state) => state.words);
  const removeBookFromLibrary = useStore(
    (state) => state.removeBookFromLibrary
  );
  const setAiSidebarOpen = useStore((state) => state.setAiSidebarOpen);
  const setActiveAiTab = useStore((state) => state.setActiveAiTab);
  const { openBook } = useNavigation();
  const showToast = useToast();

  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

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

  const counts = useMemo(
    () => ({
      all: library.length,
      reading: library.filter((book) => book.progress > 0 && book.progress < 1)
        .length,
      finished: library.filter((book) => book.progress >= 1).length,
    }),
    [library]
  );

  const filteredLibrary = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortedLibrary.filter((book) => {
      if (filter === "reading" && !(book.progress > 0 && book.progress < 1)) {
        return false;
      }
      if (filter === "finished" && book.progress < 1) return false;
      if (
        normalizedQuery &&
        !`${book.title} ${book.author}`.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [sortedLibrary, filter, query]);

  const recentBook =
    sortedLibrary.find((book) => book.lastReadAt !== null) ?? null;
  const selectedBook = detailId
    ? (library.find((book) => book.id === detailId) ?? null)
    : null;

  const handlePreview = useCallback(
    (book: LibraryBook) => {
      openBook(book.id);
      setAiSidebarOpen(true);
      setActiveAiTab("preview");
    },
    [openBook, setAiSidebarOpen, setActiveAiTab]
  );

  const handleRemove = useCallback(
    async (book: LibraryBook) => {
      setRemoving(true);
      try {
        await deleteBookFile(book.id);
        removeBookFromLibrary(book.id);
        void removeSpeechForBook(book.id).catch(() => {
          // Cache cleanup is best-effort; LRU eviction reclaims it otherwise.
        });
        setDetailId(null);
        showToast({ message: `Removed “${book.title}”.` });
      } catch (error) {
        console.error("Failed to remove book:", error);
        showToast({ message: "Could not remove this book. Try again." });
      } finally {
        setRemoving(false);
      }
    },
    [removeBookFromLibrary, showToast]
  );

  const isEmpty = library.length === 0;

  return (
    <Page>
      <header className="lib-head">
        <div>
          <p className="wordmark">
            <Icon name="brandBook" size={14} />
            {APP_DISPLAY_NAME}
          </p>
          <p className="eyebrow">
            Library · {library.length} book{library.length === 1 ? "" : "s"} ·{" "}
            {words.length} word{words.length === 1 ? "" : "s"}
          </p>
          <h1 className="display">Your library</h1>
        </div>
        <Button variant="secondary" onClick={() => setAddOpen(true)}>
          Add a book
        </Button>
      </header>

      {recentBook && (
        <LibraryHero
          book={recentBook}
          onContinue={() => openBook(recentBook.id)}
          onPreview={() => handlePreview(recentBook)}
        />
      )}

      {isEmpty ? (
        <div className="empty-library">
          <p className="eyebrow">Nothing on the shelf yet</p>
          <h2>Start your library.</h2>
          <p>
            Add an EPUB to read with chapter previews, a guide in the margin,
            and a lexicon of the words you keep.
          </p>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            Add your first book
          </Button>
          <p className="note">EPUB only · nothing is uploaded</p>
        </div>
      ) : (
        <>
          <LibraryToolbar
            filter={filter}
            onFilterChange={setFilter}
            query={query}
            onQueryChange={setQuery}
            counts={counts}
          />

          <div className="book-head" aria-hidden="true">
            <span />
            <span>Title</span>
            <span>Progress</span>
            <span>Last opened</span>
            <span />
          </div>

          {filteredLibrary.map((book) => (
            <LibraryRow
              key={book.id}
              book={book}
              onOpen={() => openBook(book.id)}
              onDetails={() => setDetailId(book.id)}
            />
          ))}

          {filteredLibrary.length === 0 && (
            <p className="empty">No books match that.</p>
          )}
        </>
      )}

      <AddBookDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <BookDetailDialog
        book={selectedBook}
        removing={removing}
        onClose={() => setDetailId(null)}
        onOpen={(book) => {
          setDetailId(null);
          openBook(book.id);
        }}
        onRemove={handleRemove}
      />
    </Page>
  );
}

import { useState } from "react";
import type { FoliateView, Highlight } from "../../types";
import { useStore } from "../../store/useStore";
import { getBookAuthor, getBookTitle } from "../../utils/metadata";
import { toPercent } from "../../utils/formatDates";
import { useBookmarks } from "../../hooks/useBookmarks";
import { BookCover } from "../ui/Cover";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { ChapterScopeSelector } from "./ChapterScopeSelector";
import { NoteList } from "./NoteList";
import { TocTree } from "./TocTree";

type DrawerTab = "contents" | "notes";

interface ContentsDrawerProps {
  viewRef: React.MutableRefObject<FoliateView | null>;
  onNavigate: (href: string) => void;
  onReadFromHere: (href: string) => void;
}

export function ContentsDrawer({
  viewRef,
  onNavigate,
  onReadFromHere,
}: ContentsDrawerProps) {
  const book = useStore((state) => state.book);
  const coverUrl = useStore((state) => state.coverUrl);
  const currentTocHref = useStore((state) => state.currentTocHref);
  const progress = useStore((state) => state.progress);
  const highlights = useStore((state) => state.highlights);
  const currentBookId = useStore((state) => state.currentBookId);
  const removeHighlight = useStore((state) => state.removeHighlight);
  const isSidebarCollapsed = useStore((state) => state.isSidebarCollapsed);
  const setSidebarCollapsed = useStore((state) => state.setSidebarCollapsed);
  const { bookmark, isCurrentPageBookmarked, canBookmark, toggleBookmark } =
    useBookmarks();
  const showToast = useToast();

  const [tab, setTab] = useState<DrawerTab>("contents");
  const open = !isSidebarCollapsed;
  const title = getBookTitle(book?.metadata, "Contents");
  const author = getBookAuthor(book?.metadata, "");
  const percent = toPercent(progress.fraction);
  const bookHighlights = currentBookId
    ? highlights
        .filter((highlight) => highlight.bookId === currentBookId)
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const close = () => setSidebarCollapsed(true);

  const handleNavigate = (href: string) => {
    onNavigate(href);
    close();
  };

  const handleReadFromHere = (href: string) => {
    onReadFromHere(href);
    close();
  };

  const handleHighlightNavigate = (highlight: Highlight) => {
    onNavigate(highlight.cfi);
    close();
  };

  const handleDeleteHighlight = async (highlight: Highlight) => {
    const view = viewRef.current;
    if (view) {
      await view.deleteAnnotation({ value: highlight.cfi });
    }
    removeHighlight(highlight.id);
  };

  const handleBookmark = () => {
    toggleBookmark();
    showToast({
      message: isCurrentPageBookmarked
        ? "Bookmark removed."
        : "Bookmark set on this page.",
    });
  };

  return (
    <aside className="toc" aria-hidden={!open} inert={!open}>
      <div className="toc-head">
        <div>
          <p className="eyebrow">Contents</p>
          <h2>{title}</h2>
        </div>
        <button
          type="button"
          className="icon-close"
          onClick={close}
          aria-label="Close contents"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="toc-book">
        <div className="toc-cover">
          <BookCover src={coverUrl} title={title} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="toc-book-title">{author || "Unknown author"}</p>
          <p className="toc-book-meta">
            {percent}% read
            {book?.toc?.length ? ` · ${book.toc.length} entries` : ""}
          </p>
          <div className="toc-track">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="toc-tabs" role="tablist" aria-label="Contents view">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "contents"}
          className={`toc-tab${tab === "contents" ? " is-on" : ""}`}
          onClick={() => setTab("contents")}
        >
          Contents
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "notes"}
          className={`toc-tab${tab === "notes" ? " is-on" : ""}`}
          onClick={() => setTab("notes")}
        >
          Notes {bookHighlights.length > 0 ? `(${bookHighlights.length})` : ""}
        </button>
      </div>

      {tab === "contents" ? (
        <nav className="toc-list" aria-label="Chapters">
          <div className="toc-scope">
            <ChapterScopeSelector toc={book?.toc ?? []} />
          </div>
          <div className="toc-tree">
            {book?.toc ? (
              <TocTree
                items={book.toc}
                currentHref={currentTocHref}
                onNavigate={handleNavigate}
                onReadFromHere={handleReadFromHere}
              />
            ) : (
              <p className="toc-empty">No book loaded.</p>
            )}
          </div>
        </nav>
      ) : (
        <div className="toc-list">
          <NoteList
            highlights={bookHighlights}
            onNavigate={handleHighlightNavigate}
            onDelete={(highlight) => {
              void handleDeleteHighlight(highlight);
            }}
          />
        </div>
      )}

      <div className="toc-foot">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleBookmark}
          disabled={!canBookmark}
          aria-pressed={isCurrentPageBookmarked}
        >
          <Icon name="bookmark" size={14} />
          {isCurrentPageBookmarked ? "Bookmarked" : "Bookmark this page"}
        </button>
        <p className="note">
          {bookmark
            ? `Bookmark: ${bookmark.label}`
            : "A bookmark follows this book, wherever you read."}
        </p>
      </div>
    </aside>
  );
}

import { memo, useEffect, useState } from "react";
import type { FoliateView, Highlight } from "../../types";
import { useStore } from "../../store/useStore";
import { getBookAuthor, getBookTitle } from "../../utils/metadata";
import { getHighlightHex } from "../../constants";
import { TOCLink } from "./TOCLink";

type SidebarTab = "contents" | "notes";

interface SidebarProps {
  onNavigate: (href: string) => void;
  viewRef: React.MutableRefObject<FoliateView | null>;
}

export const Sidebar = memo(function Sidebar({
  onNavigate,
  viewRef,
}: SidebarProps) {
  const {
    book,
    coverUrl,
    isSidebarCollapsed,
    currentTocHref,
    currentBookId,
    setCurrentTocHref,
    setSidebarCollapsed,
    highlights,
    removeHighlight,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SidebarTab>("contents");

  const title = getBookTitle(book?.metadata, "Table of Contents");
  const author = getBookAuthor(book?.metadata, "");

  const bookHighlights = currentBookId
    ? highlights
        .filter((h) => h.bookId === currentBookId)
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const handleNavigate = (href: string) => {
    onNavigate(href);
    setCurrentTocHref(href);
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  const handleHighlightNavigate = (highlight: Highlight) => {
    onNavigate(highlight.cfi);
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  const handleDeleteHighlight = async (highlight: Highlight) => {
    const view = viewRef.current;
    if (view) {
      await view.deleteAnnotation({ value: highlight.cfi });
    }
    removeHighlight(highlight.id);
  };

  useEffect(() => {
    if (!isSidebarCollapsed && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isSidebarCollapsed]);

  if (isSidebarCollapsed) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        onClick={() => setSidebarCollapsed(true)}
        aria-hidden="true"
      />

      <aside className="flex flex-col w-72 h-full bg-warm-off-white border-r border-border-warm overflow-hidden fixed md:relative left-0 top-0 z-50 md:z-auto transform transition-transform md:translate-x-0">
        <div className="flex-shrink-0 p-4 pb-0">
          <div className="flex items-center gap-3 px-2">
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-hover-warm text-light-gray-text hover:text-forest-green transition-colors"
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-10 bg-hover-warm flex items-center justify-center flex-shrink-0"
              style={
                coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined
              }
            >
              {!coverUrl && (
                <span className="material-symbols-outlined text-light-gray-text">
                  menu_book
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h1 className="text-muted-gray-text text-base font-medium leading-normal truncate">
                {title}
              </h1>
              {author && (
                <p className="text-light-gray-text text-sm font-normal leading-normal truncate">
                  {author}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1 bg-hover-warm rounded-lg p-1 mt-3 mx-2">
            <button
              onClick={() => setActiveTab("contents")}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "contents"
                  ? "bg-white text-forest-green shadow-sm"
                  : "text-light-gray-text hover:text-muted-gray-text"
              }`}
            >
              Contents
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "notes"
                  ? "bg-white text-forest-green shadow-sm"
                  : "text-light-gray-text hover:text-muted-gray-text"
              }`}
            >
              Notes
              {bookHighlights.length > 0 && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({bookHighlights.length})
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-4 scrollbar-thin">
          {activeTab === "contents" ? (
            <div className="flex flex-col gap-1">
              {book?.toc ? (
                book.toc.map((item, idx) => (
                  <TOCLink
                    key={idx}
                    item={item}
                    level={0}
                    currentHref={currentTocHref}
                    onNavigate={handleNavigate}
                  />
                ))
              ) : (
                <p className="text-light-gray-text text-sm px-3 py-2">
                  No book loaded
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {bookHighlights.length === 0 ? (
                <p className="text-light-gray-text text-sm px-3 py-2">
                  No highlights yet. Select text while reading and tap
                  Highlight.
                </p>
              ) : (
                bookHighlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="group relative p-3 rounded-lg bg-hover-warm/50 border border-border-warm hover:border-forest-green/30 transition-colors cursor-pointer"
                    onClick={() => handleHighlightNavigate(highlight)}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                        style={{
                          backgroundColor: getHighlightHex(highlight.color),
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-gray-text italic line-clamp-2">
                          &ldquo;{highlight.text}&rdquo;
                        </p>
                        {highlight.note && (
                          <p className="text-xs text-light-gray-text mt-1 line-clamp-2">
                            {highlight.note}
                          </p>
                        )}
                        {highlight.chapterLabel && (
                          <p className="text-[10px] text-light-gray-text mt-1 truncate">
                            {highlight.chapterLabel}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteHighlight(highlight);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-light-gray-text hover:text-red-600 rounded transition-all shrink-0"
                        title="Delete highlight"
                        aria-label="Delete highlight"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
});

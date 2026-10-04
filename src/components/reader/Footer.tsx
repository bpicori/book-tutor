import { memo } from "react";
import { useStore } from "../../store/useStore";
import { useBookmarks } from "../../hooks/useBookmarks";
import { ProgressBar } from "../common";

interface FooterProps {
  /** Navigates to a location in the book. */
  onNavigate: (cfi: string) => void;
}

export const Footer = memo(function Footer({ onNavigate }: FooterProps) {
  const { book, progress } = useStore();
  const { bookmark, isCurrentPageBookmarked, canBookmark, toggleBookmark } =
    useBookmarks();
  const percent = Math.round(progress.fraction * 100);

  if (!book) return null;

  const bookmarkLabel = isCurrentPageBookmarked
    ? "Remove the bookmark from this page"
    : "Bookmark this page";

  // The bookmark sits somewhere else in the book, so offer a way back to it.
  const canGoToBookmark = bookmark !== null && !isCurrentPageBookmarked;

  return (
    <footer className="p-4 md:p-6 border-t border-border-warm bg-sepia-panel">
      <div className="flex flex-col gap-2">
        <div className="flex gap-3 md:gap-6 justify-between items-center">
          <p className="text-muted-gray-text text-xs md:text-sm font-medium leading-normal truncate flex-1 min-w-0">
            {progress.tocLabel || "Reading Progress"}
          </p>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={toggleBookmark}
              disabled={!canBookmark}
              title={bookmarkLabel}
              aria-label={bookmarkLabel}
              aria-pressed={isCurrentPageBookmarked}
              className={`flex items-center gap-1 h-7 px-2 rounded-md text-xs md:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isCurrentPageBookmarked
                  ? "text-forest-green bg-active-green-light hover:bg-forest-green/15"
                  : "text-light-gray-text hover:text-forest-green hover:bg-hover-warm"
              }`}
            >
              <span
                className="material-symbols-outlined text-lg shrink-0"
                style={
                  isCurrentPageBookmarked
                    ? { fontVariationSettings: '"FILL" 1' }
                    : undefined
                }
                aria-hidden="true"
              >
                bookmark
              </span>
              <span>{isCurrentPageBookmarked ? "Saved" : "Bookmark"}</span>
            </button>

            {canGoToBookmark && (
              <button
                type="button"
                onClick={() => bookmark && onNavigate(bookmark.cfi)}
                title={`Go to bookmark: ${bookmark.label}`}
                aria-label={`Go to bookmark: ${bookmark.label}`}
                className="flex items-center justify-center w-7 h-7 rounded-md text-forest-green hover:bg-forest-green/15 transition-colors"
              >
                <span
                  className="material-symbols-outlined text-lg shrink-0"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </button>
            )}

            {progress.location && (
              <p className="text-muted-gray-text text-xs md:text-sm whitespace-nowrap">
                {progress.location.current + 1} / {progress.location.total}
              </p>
            )}
            <p className="text-light-gray-text text-xs md:text-sm whitespace-nowrap">
              {percent}%
            </p>
          </div>
        </div>
        <ProgressBar value={progress.fraction} />
      </div>
    </footer>
  );
});

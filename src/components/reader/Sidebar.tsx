import { memo, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { formatLanguageMap, formatContributor } from "../../utils/formatters";
import { TOCLink } from "./TOCLink";

interface SidebarProps {
  onNavigate: (href: string) => void;
}

export const Sidebar = memo(function Sidebar({ onNavigate }: SidebarProps) {
  const {
    book,
    coverUrl,
    isSidebarCollapsed,
    currentTocHref,
    setCurrentTocHref,
    toggleSidebar,
  } = useStore();

  const title = formatLanguageMap(book?.metadata?.title) || "Table of Contents";
  const author = formatContributor(book?.metadata?.author) || "";

  const handleNavigate = (href: string) => {
    onNavigate(href);
    setCurrentTocHref(href);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      toggleSidebar(true);
    }
  };

  // Lock body scroll on mobile when sidebar is open
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
      {/* Backdrop overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        onClick={() => toggleSidebar(true)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="flex flex-col w-72 h-full bg-warm-off-white border-r border-border-warm overflow-hidden fixed md:relative left-0 top-0 z-50 md:z-auto transform transition-transform md:translate-x-0">
        <div className="flex-shrink-0 p-4 pb-0">
          <div className="flex items-center gap-3 px-2">
            {/* Close button for mobile */}
            <button
              onClick={() => toggleSidebar(true)}
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-4 scrollbar-thin">
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
        </div>
      </aside>
    </>
  );
});

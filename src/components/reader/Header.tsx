import { memo, useState, useRef, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { useNavigation } from "../../hooks/useNavigation";
import { APP_NAME } from "../../constants";
import { getBookTitle } from "../../utils/metadata";
import { IconButton, Logo } from "../common";

interface HeaderProps {
  onPrev: () => void;
  onNext: () => void;
  /** While read-aloud plays, navigation and actions move to the footer. */
  isReadAloudActive?: boolean;
}

export const Header = memo(function Header({
  onPrev,
  onNext,
  isReadAloudActive = false,
}: HeaderProps) {
  const { book, setAiSidebarOpen, setSidebarCollapsed, isSidebarCollapsed } =
    useStore();
  const { goToLibrary, goToVocabulary, goToSettings } = useNavigation();
  const title = getBookTitle(book?.metadata, APP_NAME);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  // Cmd/Ctrl+B toggles the chapters panel while reading.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSidebarCollapsed]);

  return (
    <header className="flex items-center justify-between gap-2 sm:gap-3 border-b border-solid border-border-warm px-2 sm:px-4 md:px-8 bg-sepia-panel sticky top-0 z-30 min-h-14 md:min-h-[3.25rem]">
      {/* Left side - the chapters toggle stands alone away from the Library
          action, which is on the right. */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-muted-gray-text min-w-0 flex-1">
        <IconButton
          icon={isSidebarCollapsed ? "menu" : "menu_open"}
          label={isSidebarCollapsed ? "Show chapters" : "Hide chapters"}
          onClick={() => setSidebarCollapsed()}
        />
        <Logo size="sm" />
        <h2 className="text-muted-gray-text text-sm md:text-lg font-bold leading-tight tracking-[-0.015em] truncate hidden sm:block">
          {title}
        </h2>
      </div>

      {/* Right side - Actions. Hidden while read-aloud owns navigation so the
          footer player is the only control surface. */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {!isReadAloudActive && (
          <>
            {/* Navigation buttons - always visible */}
            <IconButton
              icon="chevron_left"
              label="Previous page"
              onClick={onPrev}
            />
            <IconButton
              icon="chevron_right"
              label="Next page"
              onClick={onNext}
            />

            {/* Desktop: Show all buttons */}
            <div className="hidden md:flex items-center gap-2">
              <IconButton
                icon="arrow_back"
                label="Back to Library"
                text="Library"
                onClick={goToLibrary}
              />
              <IconButton
                icon="book_2"
                label="Vocabulary"
                onClick={goToVocabulary}
              />
              <IconButton
                icon="settings"
                label="Settings"
                onClick={goToSettings}
              />
              <IconButton
                icon="smart_toy"
                label="Toggle AI Assistant"
                text="AI Assistant"
                onClick={() => setAiSidebarOpen()}
              />
            </div>

            {/* Mobile: Dropdown menu */}
            <div className="relative md:hidden" ref={menuRef}>
              <IconButton
                icon="more_vert"
                label="More options"
                onClick={() => setShowMenu(!showMenu)}
              />
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 min-w-[160px] border border-border-warm z-50">
                  <button
                    onClick={() => {
                      goToLibrary();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-muted-gray-text hover:bg-hover-warm flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      arrow_back
                    </span>
                    Library
                  </button>
                  <button
                    onClick={() => {
                      goToVocabulary();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-muted-gray-text hover:bg-hover-warm flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      book_2
                    </span>
                    Vocabulary
                  </button>
                  <button
                    onClick={() => {
                      goToSettings();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-muted-gray-text hover:bg-hover-warm flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      settings
                    </span>
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setAiSidebarOpen();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-muted-gray-text hover:bg-hover-warm flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      smart_toy
                    </span>
                    AI Assistant
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
});

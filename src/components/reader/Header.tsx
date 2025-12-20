import { memo, useState, useRef, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { formatLanguageMap } from "../../utils/formatters";
import { IconButton, Logo } from "../common";

interface HeaderProps {
  onPrev: () => void;
  onNext: () => void;
}

export const Header = memo(function Header({ onPrev, onNext }: HeaderProps) {
  const {
    book,
    toggleAiSidebar,
    toggleSidebar,
    isSidebarCollapsed,
    goToLibrary,
    toggleSettings,
    goToVocabulary,
  } = useStore();
  const title = formatLanguageMap(book?.metadata?.title) || "Read with AI";
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
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  return (
    <header className="flex items-center justify-between border-b border-solid border-border-warm px-4 md:px-8 py-2 md:py-3 bg-sepia-panel">
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2 md:gap-4 text-muted-gray-text min-w-0 flex-1">
        <IconButton
          icon={isSidebarCollapsed ? "menu" : "menu_open"}
          label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => toggleSidebar()}
        />
        <IconButton
          icon="arrow_back"
          label="Back to Library"
          text="Library"
          onClick={goToLibrary}
        />
        <Logo size="sm" />
        <h2 className="text-muted-gray-text text-sm md:text-lg font-bold leading-tight tracking-[-0.015em] truncate hidden sm:block">
          {title}
        </h2>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {/* Navigation buttons - always visible */}
        <IconButton
          icon="chevron_left"
          label="Previous page"
          onClick={onPrev}
        />
        <IconButton icon="chevron_right" label="Next page" onClick={onNext} />

        {/* Desktop: Show all buttons */}
        <div className="hidden md:flex items-center gap-2">
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
          <IconButton
            icon="smart_toy"
            label="Toggle AI Assistant"
            text="AI Assistant"
            onClick={() => toggleAiSidebar()}
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
                  toggleSettings();
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
                  toggleAiSidebar();
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
      </div>
    </header>
  );
});

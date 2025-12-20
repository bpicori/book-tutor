import { forwardRef } from "react";
import Markdown from "react-markdown";

interface TranslationPopupProps {
  word: string;
  definition: string | null;
  isLoading: boolean;
  error: string | null;
  left: number;
  top: number;
  width: number;
  position: "above" | "below";
  onClose: () => void;
}

export const TranslationPopup = forwardRef<
  HTMLDivElement,
  TranslationPopupProps
>(function TranslationPopup(
  { word, definition, isLoading, error, left, top, width, position, onClose },
  ref
) {
  return (
    <div
      ref={ref}
      className="fixed z-50 rounded-lg bg-sepia-panel shadow-lg border border-border-warm"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: position === "above" ? "translateY(-100%)" : "translateY(0)",
        width: `${width}px`,
      }}
    >
      <div className="relative p-2.5">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded text-muted-gray-text hover:bg-hover-warm transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        <div className="pr-4">
          <div className="text-sm font-semibold text-muted-gray-text mb-1.5">
            {word}
          </div>

          <div className="border-t border-border-warm pt-1.5">
            {isLoading && (
              <div className="text-light-gray-text text-xs">
                Loading definition...
              </div>
            )}
            {error && <div className="text-red-600 text-xs">{error}</div>}
            {definition && (
              <div className="text-muted-gray-text text-xs leading-relaxed">
                <Markdown
                  components={{
                    // Render inline without wrapping <p> tags
                    p: ({ children }) => <>{children}</>,
                  }}
                >
                  {definition}
                </Markdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

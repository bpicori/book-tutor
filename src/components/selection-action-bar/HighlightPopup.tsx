import { forwardRef, useCallback, useEffect, useState } from "react";
import type { FoliateView, Highlight, HighlightColor } from "../../types";
import { HIGHLIGHT_COLORS, getHighlightHex } from "../../constants";
import { useStore } from "../../store/useStore";

interface HighlightPopupProps {
  highlight: Highlight;
  viewRef: React.MutableRefObject<FoliateView | null>;
  left: number;
  top: number;
  width: number;
  position: "above" | "below";
  onClose: () => void;
  onAskAI: (text: string) => void;
}

export const HighlightPopup = forwardRef<HTMLDivElement, HighlightPopupProps>(
  function HighlightPopup(
    { highlight, viewRef, left, top, width, position, onClose, onAskAI },
    ref
  ) {
    const { updateHighlight, removeHighlight } = useStore();
    const [note, setNote] = useState(highlight.note ?? "");

    useEffect(() => {
      setNote(highlight.note ?? "");
    }, [highlight.id, highlight.note]);

    const handleColorChange = useCallback(
      async (color: HighlightColor) => {
        const hex = getHighlightHex(color);
        updateHighlight(highlight.id, { color });
        const view = viewRef.current;
        if (view) {
          await view.deleteAnnotation({ value: highlight.cfi });
          await view.addAnnotation({ value: highlight.cfi, color: hex });
        }
      },
      [highlight.id, highlight.cfi, updateHighlight, viewRef]
    );

    const handleNoteBlur = useCallback(() => {
      const trimmed = note.trim();
      if (trimmed !== (highlight.note ?? "")) {
        updateHighlight(highlight.id, { note: trimmed || undefined });
      }
    }, [highlight.id, highlight.note, note, updateHighlight]);

    const handleDelete = useCallback(async () => {
      const view = viewRef.current;
      if (view) {
        await view.deleteAnnotation({ value: highlight.cfi });
      }
      removeHighlight(highlight.id);
      onClose();
    }, [highlight.id, highlight.cfi, removeHighlight, viewRef, onClose]);

    const handleAskAI = useCallback(() => {
      const quote = highlight.text;
      const prompt = `Can you explain this passage from the book?\n\n"${quote}"`;
      onAskAI(prompt);
      onClose();
    }, [highlight.text, onAskAI, onClose]);

    return (
      <div
        ref={ref}
        className="fixed z-50 rounded-lg bg-sepia-panel shadow-lg border border-border-warm"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          transform:
            position === "above" ? "translateY(-100%)" : "translateY(0)",
          width: `${width}px`,
        }}
        data-selection-bar
      >
        <div className="relative p-3">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded text-muted-gray-text hover:bg-hover-warm transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>

          <p className="text-xs text-muted-gray-text italic pr-6 mb-2 line-clamp-2">
            &ldquo;{highlight.text}&rdquo;
          </p>

          <div className="flex items-center gap-1.5 mb-2">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleColorChange(c.id)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  highlight.color === c.id
                    ? "border-forest-green scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
                aria-label={`${c.label} highlight`}
              />
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add a note..."
            rows={2}
            className="w-full text-xs bg-warm-off-white border border-border-warm rounded-md px-2 py-1.5 text-muted-gray-text placeholder-light-gray-text outline-none focus:ring-1 focus:ring-forest-green resize-none mb-2"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleAskAI}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-forest-green bg-active-green-light rounded-md hover:bg-forest-green/10 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              Ask AI
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete highlight"
              aria-label="Delete highlight"
            >
              <span className="material-symbols-outlined text-base">
                delete
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

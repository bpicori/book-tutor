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

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

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
      onAskAI(
        `Can you explain this passage from the book?\n\n"${highlight.text}"`
      );
      onClose();
    }, [highlight.text, onAskAI, onClose]);

    return (
      <div
        ref={ref}
        className="def-pop is-on hl-pop"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          transform:
            position === "above" ? "translateY(-100%)" : "translateY(0)",
          width: `${width}px`,
          maxHeight: "calc(100vh - 24px)",
          overflowY: "auto",
        }}
        data-selection-bar
        role="dialog"
        aria-label="Highlight options"
      >
        <button
          type="button"
          className="def-close"
          onClick={onClose}
          aria-label="Close highlight options"
        >
          ×
        </button>

        <p className="def-text" style={{ paddingRight: 24 }}>
          “{highlight.text}”
        </p>

        <div className="hl-colors" role="group" aria-label="Highlight color">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              className={`hl-color${highlight.color === color.id ? " is-on" : ""}`}
              style={{ backgroundColor: color.hex }}
              title={color.label}
              aria-label={`${color.label} highlight`}
              onClick={() => void handleColorChange(color.id)}
            />
          ))}
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Add a note…"
          rows={2}
          className="hl-note"
          aria-label="Highlight note"
        />

        <div className="hl-actions">
          <button type="button" onClick={handleAskAI}>
            Ask the guide
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => void handleDelete()}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }
);

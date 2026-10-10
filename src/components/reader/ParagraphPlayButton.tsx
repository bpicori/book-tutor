import { memo } from "react";

interface ParagraphPlayButtonProps {
  left: number;
  top: number;
  onPlay: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Floating "Read from here" button shown on paragraph hover. Rendered in the
 * parent layer so the book DOM is never modified.
 */
export const ParagraphPlayButton = memo(function ParagraphPlayButton({
  left,
  top,
  onPlay,
  onMouseEnter,
  onMouseLeave,
}: ParagraphPlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onPlay}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-20 flex items-center justify-center w-8 h-8 rounded-full bg-forest-green text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-green/40"
      style={{ left, top }}
      aria-label="Read from here"
      title="Read from here"
    >
      <span className="material-symbols-outlined text-lg" aria-hidden="true">
        play_arrow
      </span>
    </button>
  );
});

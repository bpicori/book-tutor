import { memo } from "react";
import { Icon } from "../ui/Icon";

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
      className="para-play"
      style={{ left, top }}
      aria-label="Read from here"
      title="Read from here"
    >
      <Icon name="play" size={11} />
    </button>
  );
});

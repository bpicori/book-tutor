import { useEffect } from "react";
import type { FoliateView } from "../types";

export function useKeyboardNavigation(
  viewRef: React.MutableRefObject<FoliateView | null>,
  disabled = false
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Read-aloud owns page turns while it is playing.
      if (disabled) return;

      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") viewRef.current?.goLeft();
      else if (e.key === "ArrowRight") viewRef.current?.goRight();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [viewRef, disabled]);
}

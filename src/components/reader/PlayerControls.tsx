import { memo } from "react";
import type { ReadAloudPlayer } from "../../hooks/useReadAloud";

interface PlayerControlsProps {
  player: ReadAloudPlayer;
}

const CONTROL_BUTTON =
  "flex items-center justify-center w-8 h-8 rounded-md text-muted-gray-text transition-colors hover:text-forest-green hover:bg-hover-warm disabled:opacity-40 disabled:cursor-not-allowed";

const TEXT_BUTTON =
  "flex items-center gap-1 h-8 px-2.5 rounded-md text-xs md:text-sm font-medium text-forest-green bg-active-green-light hover:bg-forest-green/20 transition-colors";

/**
 * Footer read-aloud controls. Rendered only while the player is active, in
 * place of the bookmark and location cluster so the footer keeps its height.
 */
export const PlayerControls = memo(function PlayerControls({
  player,
}: PlayerControlsProps) {
  const { status, error, toggle, prev, next, stop, retry, nextChapter } =
    player;

  if (status === "error") {
    return (
      <div
        className="flex items-center gap-2 min-w-0"
        role="group"
        aria-label="Read aloud error"
      >
        <span
          className="material-symbols-outlined text-lg text-red-500 shrink-0"
          aria-hidden="true"
        >
          error
        </span>
        <p
          className="text-xs md:text-sm text-red-600 truncate max-w-[12rem] md:max-w-sm"
          title={error ?? undefined}
        >
          {error ?? "Voice unavailable."}
        </p>
        <button
          type="button"
          onClick={retry}
          className={CONTROL_BUTTON}
          aria-label="Retry reading"
          title="Retry"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
        </button>
        <button
          type="button"
          onClick={stop}
          className={CONTROL_BUTTON}
          aria-label="Stop reading"
          title="Stop"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    );
  }

  if (status === "chapterEnd") {
    return (
      <div
        className="flex items-center gap-2 min-w-0"
        role="group"
        aria-label="Chapter finished"
      >
        <p className="text-xs md:text-sm text-muted-gray-text whitespace-nowrap">
          Chapter finished
        </p>
        <button
          type="button"
          onClick={nextChapter}
          className={TEXT_BUTTON}
          aria-label="Read next chapter"
        >
          <span className="material-symbols-outlined text-lg">menu_book</span>
          <span className="hidden sm:inline">Read next chapter</span>
          <span className="sm:hidden">Next</span>
        </button>
        <button
          type="button"
          onClick={stop}
          className={CONTROL_BUTTON}
          aria-label="Stop reading"
          title="Stop"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    );
  }

  const isLoading = status === "loading";
  const isPlaying = status === "playing";

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="Read aloud"
    >
      <button
        type="button"
        onClick={prev}
        disabled={!player.canPrev}
        className={CONTROL_BUTTON}
        aria-label="Previous paragraph"
        title="Previous paragraph"
      >
        <span className="material-symbols-outlined text-lg">skip_previous</span>
      </button>
      <button
        type="button"
        onClick={toggle}
        disabled={isLoading}
        className={CONTROL_BUTTON}
        aria-label={isPlaying ? "Pause reading" : "Play reading"}
        aria-pressed={isPlaying}
        title={isPlaying ? "Pause" : "Play"}
      >
        <span
          className={`material-symbols-outlined text-xl ${
            isLoading ? "animate-spin" : ""
          }`}
          aria-hidden="true"
        >
          {isLoading ? "progress_activity" : isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>
      <button
        type="button"
        onClick={next}
        disabled={!player.canNext}
        className={CONTROL_BUTTON}
        aria-label="Next paragraph"
        title="Next paragraph"
      >
        <span className="material-symbols-outlined text-lg">skip_next</span>
      </button>
      <button
        type="button"
        onClick={stop}
        className={CONTROL_BUTTON}
        aria-label="Stop reading"
        title="Stop"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
});

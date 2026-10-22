import type { ReadAloudPlayer } from "../../hooks/useReadAloud";
import { Icon } from "../ui/Icon";
import { Spinner } from "../ui/Spinner";

interface PlayerBarProps {
  player: ReadAloudPlayer;
  chapterLabel: string;
  onOpenSettings: () => void;
}

const RATES = [0.8, 1, 1.2, 1.5];

export function PlayerBar({
  player,
  chapterLabel,
  onOpenSettings,
}: PlayerBarProps) {
  if (!player.isActive) return null;

  if (player.status === "error") {
    return (
      <div className="player is-on" role="region" aria-label="Read aloud">
        <div className="player-meta">
          <p className="eyebrow">Listening</p>
          <p className="player-error" title={player.error ?? undefined}>
            {player.error ?? "Voice unavailable."}
          </p>
        </div>
        <button
          type="button"
          className="player-action"
          onClick={player.retry}
          aria-label="Retry reading"
          title="Retry"
        >
          <Icon name="refresh" size={14} />
        </button>
        <button type="button" className="player-link" onClick={onOpenSettings}>
          Voice settings
        </button>
        <button
          type="button"
          className="player-stop"
          onClick={player.stop}
          aria-label="Stop listening"
          title="Stop"
        >
          ×
        </button>
      </div>
    );
  }

  if (player.status === "chapterEnd") {
    return (
      <div className="player is-on" role="region" aria-label="Read aloud">
        <div className="player-meta">
          <p className="eyebrow">Listening</p>
          <p className="player-label">Chapter finished</p>
        </div>
        <button
          type="button"
          className="player-action"
          onClick={player.nextChapter}
          aria-label="Read next chapter"
          title="Read next chapter"
        >
          <Icon name="next" size={14} />
        </button>
        <button
          type="button"
          className="player-stop"
          onClick={player.stop}
          aria-label="Stop listening"
          title="Stop"
        >
          ×
        </button>
      </div>
    );
  }

  const isPlaying = player.status === "playing";
  const isLoading = player.status === "loading";
  const label = player.paragraphCount
    ? `paragraph ${player.paragraphIndex + 1} of ${player.paragraphCount}`
    : "preparing audio";
  const rates = RATES.includes(player.playbackRate)
    ? RATES
    : [...RATES, player.playbackRate].sort((a, b) => a - b);

  return (
    <div className="player is-on" role="region" aria-label="Read aloud">
      <button
        type="button"
        className="player-toggle"
        onClick={player.toggle}
        disabled={isLoading}
        aria-label={isPlaying ? "Pause reading" : "Resume reading"}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isLoading ? (
          <Spinner label="Loading audio" />
        ) : (
          <Icon name={isPlaying ? "pause" : "play"} size={12} />
        )}
      </button>

      <div className="player-meta">
        <p className="eyebrow">Listening</p>
        <p className="player-label" title={`${chapterLabel} · ${label}`}>
          {chapterLabel} · {label}
        </p>
      </div>

      <div className="player-actions">
        <button
          type="button"
          className="player-action"
          onClick={player.prev}
          disabled={!player.canPrev}
          aria-label="Previous paragraph"
          title="Previous paragraph"
        >
          <Icon name="prev" size={13} />
        </button>
        <button
          type="button"
          className="player-action"
          onClick={player.next}
          disabled={!player.canNext}
          aria-label="Next paragraph"
          title="Next paragraph"
        >
          <Icon name="next" size={13} />
        </button>
      </div>

      <label className="player-rate">
        Rate
        <select
          value={player.playbackRate}
          aria-label="Playback speed"
          onChange={(event) =>
            player.setPlaybackRate(Number(event.target.value))
          }
        >
          {rates.map((rate) => (
            <option key={rate} value={rate}>
              {rate}×
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="player-stop"
        onClick={player.stop}
        aria-label="Stop listening"
        title="Stop"
      >
        ×
      </button>
    </div>
  );
}

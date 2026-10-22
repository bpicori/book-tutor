interface TrackProps {
  /** 0–100. */
  value: number;
  accent?: boolean;
}

export function Track({ value, accent = false }: TrackProps) {
  const clamped = Math.max(
    0,
    Math.min(100, Number.isFinite(value) ? value : 0)
  );
  return (
    <div className="track" aria-hidden="true">
      <span
        className={accent ? "accent" : undefined}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

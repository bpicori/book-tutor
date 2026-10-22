const DAY_MS = 24 * 60 * 60 * 1000;

/** "Today", "Yesterday", "3 days ago", or a short date. */
export function formatRelativeDate(timestamp: number | null): string {
  if (!timestamp) return "Not started";

  const now = Date.now();
  const diff = Math.max(0, now - timestamp);
  const days = Math.floor(diff / DAY_MS);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Short date used for vocabulary entries. */
export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Rounds a 0–1 library fraction to a percentage. */
export function toPercent(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.max(0, Math.min(100, Math.round(fraction * 100)));
}

interface BookCoverProps {
  src?: string | null;
  title: string;
  fallbackClassName?: string;
}

export function BookCover({
  src,
  title,
  fallbackClassName = "thumb-fallback",
}: BookCoverProps) {
  if (src) {
    return <img src={src} alt={`Cover of ${title}`} />;
  }

  const initials =
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "BT";

  return (
    <span className={fallbackClassName} aria-hidden="true">
      {initials}
    </span>
  );
}

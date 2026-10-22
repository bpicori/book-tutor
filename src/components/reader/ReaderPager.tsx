import { Icon } from "../ui/Icon";

interface ReaderPagerProps {
  onPrev: () => void;
  onNext: () => void;
  current?: number;
  total?: number;
  percent: number;
}

export function ReaderPager({
  onPrev,
  onNext,
  current,
  total,
  percent,
}: ReaderPagerProps) {
  const label =
    typeof current === "number" && typeof total === "number"
      ? `${current + 1} / ${total}`
      : `${percent}%`;

  return (
    <div className="reader-pager">
      <button type="button" onClick={onPrev} aria-label="Previous page">
        <Icon name="prev" size={14} />
      </button>
      <span>{label}</span>
      <button type="button" onClick={onNext} aria-label="Next page">
        <Icon name="next" size={14} />
      </button>
    </div>
  );
}

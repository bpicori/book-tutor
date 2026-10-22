import { Icon } from "../ui/Icon";

interface ReaderPagerProps {
  onPrev: () => void;
  onNext: () => void;
  percent: number;
}

export function ReaderPager({ onPrev, onNext, percent }: ReaderPagerProps) {
  return (
    <div className="reader-pager">
      <button type="button" onClick={onPrev} aria-label="Previous page">
        <Icon name="prev" size={14} />
      </button>
      <span>{percent}%</span>
      <button type="button" onClick={onNext} aria-label="Next page">
        <Icon name="next" size={14} />
      </button>
    </div>
  );
}

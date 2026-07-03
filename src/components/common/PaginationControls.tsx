import { IconButton } from "./IconButton";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  className = "",
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <IconButton
        icon="chevron_left"
        label="Previous page"
        onClick={onPrev}
        disabled={currentPage <= 1}
      />
      <span className="text-sm text-light-gray-text min-w-[4rem] text-center">
        {currentPage} / {totalPages}
      </span>
      <IconButton
        icon="chevron_right"
        label="Next page"
        onClick={onNext}
        disabled={currentPage >= totalPages}
      />
    </div>
  );
}

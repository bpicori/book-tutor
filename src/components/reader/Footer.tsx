import { memo } from "react";
import { useStore } from "../../store/useStore";
import { ProgressBar } from "../common";

export const Footer = memo(function Footer() {
  const { book, progress } = useStore();
  const percent = Math.round(progress.fraction * 100);

  if (!book) return null;

  return (
    <footer className="p-4 md:p-6 border-t border-border-warm bg-sepia-panel">
      <div className="flex flex-col gap-2">
        <div className="flex gap-3 md:gap-6 justify-between items-center">
          <p className="text-muted-gray-text text-xs md:text-sm font-medium leading-normal truncate flex-1 min-w-0">
            {progress.tocLabel || "Reading Progress"}
          </p>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {progress.location && (
              <p className="text-muted-gray-text text-xs md:text-sm whitespace-nowrap">
                {progress.location.current + 1} / {progress.location.total}
              </p>
            )}
            <p className="text-light-gray-text text-xs md:text-sm whitespace-nowrap">
              {percent}%
            </p>
          </div>
        </div>
        <ProgressBar value={progress.fraction} />
      </div>
    </footer>
  );
});

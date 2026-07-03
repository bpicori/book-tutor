import type { ReactNode } from "react";

interface ChapterContextBarProps {
  chapterLabel: string;
  actions?: ReactNode;
}

export function ChapterContextBar({
  chapterLabel,
  actions,
}: ChapterContextBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-hover-warm/30 border-b border-border-warm">
      <span className="material-symbols-outlined text-forest-green text-lg shrink-0">
        menu_book
      </span>
      <span className="text-sm text-muted-gray-text font-medium truncate flex-1">
        {chapterLabel}
      </span>
      {actions}
    </div>
  );
}

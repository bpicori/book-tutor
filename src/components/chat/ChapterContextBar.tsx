import type { ReactNode } from "react";

interface ChapterContextBarProps {
  chapterLabel: string;
  /** Scope the AI answers cover, when it is wider than the current section. */
  scopeLabel?: string;
  actions?: ReactNode;
}

export function ChapterContextBar({
  chapterLabel,
  scopeLabel,
  actions,
}: ChapterContextBarProps) {
  const isScoped = Boolean(scopeLabel && scopeLabel !== chapterLabel);

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-hover-warm/30 border-b border-border-warm">
      <span className="material-symbols-outlined text-forest-green text-lg shrink-0">
        menu_book
      </span>
      <div className="flex-1 min-w-0">
        <span className="block text-sm text-muted-gray-text font-medium truncate">
          {chapterLabel}
        </span>
        {isScoped && (
          <span className="block text-[11px] text-light-gray-text truncate">
            AI covers &ldquo;{scopeLabel}&rdquo;
          </span>
        )}
      </div>
      {actions}
    </div>
  );
}

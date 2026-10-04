import { memo, useEffect, useRef } from "react";
import type { TOCItem } from "../../types";

/** Expandable entries are keyed by href, which is unique inside a book. */
export function tocItemKey(item: TOCItem): string {
  return item.href;
}

interface TOCLinkProps {
  item: TOCItem;
  level: number;
  currentHref: string | null;
  onNavigate: (href: string) => void;
  isExpanded: (item: TOCItem) => boolean;
  onToggle: (item: TOCItem) => void;
}

export const TOCLink = memo(function TOCLink({
  item,
  level,
  currentHref,
  onNavigate,
  isExpanded,
  onToggle,
}: TOCLinkProps) {
  const isActive = currentHref === item.href;
  const hasChildren = Boolean(item.subitems?.length);
  const expanded = hasChildren && isExpanded(item);
  const linkRef = useRef<HTMLAnchorElement>(null);

  // Keep the entry the reader is in visible without scrolling the whole list.
  useEffect(() => {
    if (isActive) {
      linkRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isActive]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(item.href);
  };

  const toggleLabel = expanded
    ? `Collapse ${item.label}`
    : `Expand ${item.label}`;

  return (
    <>
      <div className="flex items-stretch gap-0.5">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(item)}
            aria-expanded={expanded}
            aria-label={toggleLabel}
            title={toggleLabel}
            className="w-6 shrink-0 flex items-center justify-center rounded-md text-light-gray-text hover:bg-hover-warm hover:text-forest-green transition-colors"
          >
            <span className="material-symbols-outlined text-base shrink-0">
              {expanded ? "expand_more" : "chevron_right"}
            </span>
          </button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden="true" />
        )}

        <a
          ref={linkRef}
          href="#"
          onClick={handleClick}
          className={`flex flex-1 min-w-0 items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
            isActive
              ? "bg-active-green-light text-forest-green"
              : "text-muted-gray-text hover:bg-hover-warm"
          }`}
        >
          <span className="material-symbols-outlined text-lg shrink-0">
            {level > 0 ? "subdirectory_arrow_right" : "description"}
          </span>
          <p className="text-sm font-medium leading-normal truncate">
            {item.label}
          </p>
        </a>
      </div>

      {expanded &&
        item.subitems?.map((subitem, idx) => (
          <TOCLink
            key={subitem.href || idx}
            item={subitem}
            level={level + 1}
            currentHref={currentHref}
            onNavigate={onNavigate}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        ))}
    </>
  );
});

import { memo, useEffect, useRef } from "react";
import type { TOCItem } from "../../types";
import { Icon } from "../ui/Icon";

/** Expandable entries are keyed by href, which is unique inside a book. */
export function tocItemKey(item: TOCItem): string {
  return item.href;
}

interface TOCLinkProps {
  item: TOCItem;
  level: number;
  currentHref: string | null;
  onNavigate: (href: string) => void;
  /** Starts read-aloud at the beginning of this chapter. */
  onReadFromHere: (href: string) => void;
  isExpanded: (item: TOCItem) => boolean;
  onToggle: (item: TOCItem) => void;
}

export const TOCLink = memo(function TOCLink({
  item,
  level,
  currentHref,
  onNavigate,
  onReadFromHere,
  isExpanded,
  onToggle,
}: TOCLinkProps) {
  const isActive = currentHref === item.href;
  const hasChildren = Boolean(item.subitems?.length);
  const expanded = hasChildren && isExpanded(item);
  const linkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive) {
      linkRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isActive]);

  const toggleLabel = expanded
    ? `Collapse ${item.label}`
    : `Expand ${item.label}`;

  return (
    <>
      <div className="toc-entry">
        {hasChildren ? (
          <button
            type="button"
            className="toc-entry-toggle"
            onClick={() => onToggle(item)}
            aria-expanded={expanded}
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            <Icon name={expanded ? "chevronDown" : "chevronRight"} size={13} />
          </button>
        ) : (
          <span className="toc-entry-toggle" aria-hidden="true" />
        )}

        <button
          ref={linkRef}
          type="button"
          className={`toc-entry-link${isActive ? " is-current" : ""}`}
          style={{ paddingLeft: 8 + level * 14 }}
          aria-current={isActive ? "page" : undefined}
          onClick={() => onNavigate(item.href)}
        >
          <span className="toc-label">{item.label}</span>
        </button>

        <button
          type="button"
          className="toc-entry-play"
          onClick={() => onReadFromHere(item.href)}
          aria-label={`Read from here: ${item.label}`}
          title="Read from here"
        >
          <Icon name="play" size={10} />
        </button>
      </div>

      {expanded &&
        item.subitems?.map((subitem, index) => (
          <TOCLink
            key={subitem.href || index}
            item={subitem}
            level={level + 1}
            currentHref={currentHref}
            onNavigate={onNavigate}
            onReadFromHere={onReadFromHere}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        ))}
    </>
  );
});

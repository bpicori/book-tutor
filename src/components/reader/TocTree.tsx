import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { TOCItem } from "../../types";
import { flattenTocWithDepth, getAncestorPath } from "../../utils/tocUtils";
import { TOCLink, tocItemKey } from "./TOCLink";

interface TocTreeProps {
  items: TOCItem[];
  currentHref: string | null;
  onNavigate: (href: string) => void;
}

/**
 * Table of contents with collapsible levels.
 *
 * Nested books can list hundreds of entries, so only the outermost level starts
 * expanded. The path to wherever the reader is opens automatically, and the
 * reader can open or close any branch.
 */
export const TocTree = memo(function TocTree({
  items,
  currentHref,
  onNavigate,
}: TocTreeProps) {
  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [collapsedKeys, setCollapsedKeys] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const topLevelKeys = useMemo(
    () =>
      new Set(
        flattenTocWithDepth(items)
          .filter((entry) => entry.depth === 0)
          .map((entry) => entry.href)
      ),
    [items]
  );

  // Ancestors of the entry the reader is in, excluding the entry itself.
  const activePath = useMemo(() => {
    if (!currentHref) return [];
    const path = getAncestorPath(currentHref, items);
    return path.slice(0, -1).map((entry) => entry.href);
  }, [currentHref, items]);

  // Open the path to wherever the reader is, without fighting a manual close
  // of the same branch on a later render.
  useEffect(() => {
    if (activePath.length === 0) return;

    setExpandedKeys((previous) => {
      const missing = activePath.filter((href) => !previous.has(href));
      if (missing.length === 0) return previous;
      const next = new Set(previous);
      for (const href of missing) next.add(href);
      return next;
    });

    setCollapsedKeys((previous) => {
      if (!activePath.some((href) => previous.has(href))) return previous;
      const next = new Set(previous);
      for (const href of activePath) next.delete(href);
      return next;
    });
  }, [activePath]);

  const isExpanded = useCallback(
    (item: TOCItem) => {
      const key = tocItemKey(item);
      // Top-level entries start open; nested ones start closed.
      const openByDefault = topLevelKeys.has(key);
      return collapsedKeys.has(key)
        ? false
        : expandedKeys.has(key) || openByDefault;
    },
    [collapsedKeys, expandedKeys, topLevelKeys]
  );

  const onToggle = useCallback(
    (item: TOCItem) => {
      const key = tocItemKey(item);
      const openByDefault = topLevelKeys.has(key);
      const isOpen =
        !collapsedKeys.has(key) && (expandedKeys.has(key) || openByDefault);

      if (isOpen) {
        setCollapsedKeys((previous) => new Set(previous).add(key));
        setExpandedKeys((previous) => {
          if (!previous.has(key)) return previous;
          const next = new Set(previous);
          next.delete(key);
          return next;
        });
      } else {
        setExpandedKeys((previous) => new Set(previous).add(key));
        setCollapsedKeys((previous) => {
          if (!previous.has(key)) return previous;
          const next = new Set(previous);
          next.delete(key);
          return next;
        });
      }
    },
    [collapsedKeys, expandedKeys, topLevelKeys]
  );

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, idx) => (
        <TOCLink
          key={item.href || idx}
          item={item}
          level={0}
          currentHref={currentHref}
          onNavigate={onNavigate}
          isExpanded={isExpanded}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
});

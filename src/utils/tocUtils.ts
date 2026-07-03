import type { TOCItem } from "../types";

export interface FlatTocEntry {
  item: TOCItem;
  href: string;
  label: string;
  depth: number;
  parentHref: string | null;
}

const PREVIEW_MAX_DEPTH = 1;

export function isPreviewEligible(depth: number): boolean {
  return depth <= PREVIEW_MAX_DEPTH;
}

export function flattenTocWithDepth(toc: TOCItem[]): FlatTocEntry[] {
  const entries: FlatTocEntry[] = [];

  const walk = (items: TOCItem[], depth: number, parentHref: string | null) => {
    for (const item of items) {
      if (!item.href) continue;
      entries.push({
        item,
        href: item.href,
        label: item.label,
        depth,
        parentHref,
      });
      if (item.subitems?.length) {
        walk(item.subitems, depth + 1, item.href);
      }
    }
  };

  walk(toc, 0, null);
  return entries;
}

export function findTocEntry(
  href: string,
  toc: TOCItem[]
): FlatTocEntry | null {
  return flattenTocWithDepth(toc).find((entry) => entry.href === href) ?? null;
}

export function getPreviewEligibleAncestor(
  href: string,
  toc: TOCItem[]
): FlatTocEntry | null {
  const entries = flattenTocWithDepth(toc);
  const byHref = new Map(entries.map((entry) => [entry.href, entry]));

  let current = byHref.get(href);
  if (!current) return null;

  while (current && !isPreviewEligible(current.depth)) {
    if (!current.parentHref) return null;
    current = byHref.get(current.parentHref);
  }

  return current ?? null;
}

export function resolveTocContext(
  href: string | null,
  toc: TOCItem[] | undefined,
  fallbackLabel = "Current Chapter"
): {
  chapterLabel: string;
  chapterHref: string;
  previewHref: string;
  previewLabel: string;
  tocDepth: number;
  isPreviewRolledUp: boolean;
} {
  const chapterHref = href || "default";

  if (!href || !toc?.length) {
    return {
      chapterLabel: fallbackLabel,
      chapterHref,
      previewHref: chapterHref,
      previewLabel: fallbackLabel,
      tocDepth: 0,
      isPreviewRolledUp: false,
    };
  }

  const entry = findTocEntry(href, toc);
  if (!entry) {
    return {
      chapterLabel: fallbackLabel,
      chapterHref,
      previewHref: chapterHref,
      previewLabel: fallbackLabel,
      tocDepth: 0,
      isPreviewRolledUp: false,
    };
  }

  const previewTarget = isPreviewEligible(entry.depth)
    ? entry
    : getPreviewEligibleAncestor(href, toc);

  const previewHref = previewTarget?.href ?? href;
  const previewLabel = previewTarget?.label ?? entry.label;

  return {
    chapterLabel: entry.label,
    chapterHref: href,
    previewHref,
    previewLabel,
    tocDepth: entry.depth,
    isPreviewRolledUp: previewHref !== href,
  };
}
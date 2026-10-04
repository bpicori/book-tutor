import type { TOCItem } from "../types";

export interface FlatTocEntry {
  item: TOCItem;
  href: string;
  label: string;
  depth: number;
  parentHref: string | null;
}

const PREVIEW_MAX_DEPTH = 1;

/**
 * Depth of a table of contents as a reader thinks about it: 0 is the outermost
 * level, 1 is the level nested under it, and so on.
 */
export type TocDepth = number;

export function isPreviewEligible(depth: number): boolean {
  return depth <= PREVIEW_MAX_DEPTH;
}

export interface TocScopeOption {
  depth: TocDepth;
  /** How many entries live at exactly this depth. */
  count: number;
  /** How many entries are at or above this depth, i.e. how many scopes exist. */
  scopeCount: number;
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

/** Entry plus every ancestor, outermost first. */
export function getAncestorPath(href: string, toc: TOCItem[]): FlatTocEntry[] {
  const entries = flattenTocWithDepth(toc);
  const byHref = new Map(entries.map((entry) => [entry.href, entry]));

  const path: FlatTocEntry[] = [];
  let current = byHref.get(href);
  while (current) {
    path.unshift(current);
    current = current.parentHref ? byHref.get(current.parentHref) : undefined;
  }
  return path;
}

/**
 * The entry that acts as "the chapter" for a given depth: the entry itself when
 * it already sits at that depth, otherwise its nearest ancestor at or above it.
 */
export function resolveScopeEntry(
  href: string,
  toc: TOCItem[],
  depth: TocDepth
): FlatTocEntry | null {
  const path = getAncestorPath(href, toc);
  if (path.length === 0) return null;

  // Ancestors above the requested depth have no parent to fall back to, so the
  // outermost entry wins for depths smaller than the top level.
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].depth <= depth) return path[i];
  }
  return path[0];
}

export function findTocEntry(
  href: string,
  toc: TOCItem[]
): FlatTocEntry | null {
  return flattenTocWithDepth(toc).find((entry) => entry.href === href) ?? null;
}

/** Depths available in this book, ordered from the outermost level inward. */
export function getTocDepthOptions(toc: TOCItem[]): TocScopeOption[] {
  const entries = flattenTocWithDepth(toc);
  const counts = new Map<TocDepth, number>();
  let maxDepth = 0;

  for (const entry of entries) {
    counts.set(entry.depth, (counts.get(entry.depth) ?? 0) + 1);
    maxDepth = Math.max(maxDepth, entry.depth);
  }

  const options: TocScopeOption[] = [];
  for (let depth = 0; depth <= maxDepth; depth++) {
    let scopeCount = 0;
    for (const entry of entries) {
      if (entry.depth <= depth) scopeCount++;
    }
    options.push({
      depth,
      count: counts.get(depth) ?? 0,
      scopeCount,
    });
  }

  return options;
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

export interface TocContext {
  /** The entry the reader is currently in. */
  chapterLabel: string;
  chapterHref: string;
  /** Entry whose content feeds the chapter preview. */
  previewHref: string;
  previewLabel: string;
  /** Entry whose content feeds new Ask AI conversations. */
  askHref: string;
  askLabel: string;
  tocDepth: number;
  isPreviewRolledUp: boolean;
  isAskRolledUp: boolean;
  /** True when an explicit chapter depth is in force for this book. */
  scoped: boolean;
}

/**
 * Resolves the reader's current position to the entries used by the Preview
 * and Ask AI features.
 *
 * `chapterDepth` is the per-book choice of "what counts as a chapter":
 * - `null` keeps the original behaviour: a preview is generated for the
 *   outermost level, while Ask AI stays on the exact entry the reader is in.
 * - a number rolls both up to the entry at that depth.
 */
export function resolveTocContext(
  href: string | null,
  toc: TOCItem[] | undefined,
  fallbackLabel = "Current Chapter",
  chapterDepth: TocDepth | null = null
): TocContext {
  const chapterHref = href || "default";

  const noContext: TocContext = {
    chapterLabel: fallbackLabel,
    chapterHref,
    previewHref: chapterHref,
    previewLabel: fallbackLabel,
    askHref: chapterHref,
    askLabel: fallbackLabel,
    tocDepth: 0,
    isPreviewRolledUp: false,
    isAskRolledUp: false,
    scoped: false,
  };

  if (!href || !toc?.length) return noContext;

  const entry = findTocEntry(href, toc);
  if (!entry) return noContext;

  if (chapterDepth !== null) {
    const scope = resolveScopeEntry(href, toc, chapterDepth);
    const scopeHref = scope?.href ?? href;
    const scopeLabel = scope?.label ?? entry.label;
    return {
      chapterLabel: entry.label,
      chapterHref: href,
      previewHref: scopeHref,
      previewLabel: scopeLabel,
      askHref: scopeHref,
      askLabel: scopeLabel,
      tocDepth: entry.depth,
      isPreviewRolledUp: scopeHref !== href,
      isAskRolledUp: scopeHref !== href,
      scoped: true,
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
    askHref: href,
    askLabel: entry.label,
    tocDepth: entry.depth,
    isPreviewRolledUp: previewHref !== href,
    isAskRolledUp: false,
    scoped: false,
  };
}

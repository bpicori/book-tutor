import { formatLanguageMap } from "./formatters";
import type { Book, ChapterPreviews, TOCItem } from "../types";

/**
 * Extracts a string value from book metadata that might be:
 * - A plain string
 * - An array of strings
 * - An object with language keys (e.g., { en: 'value', de: 'wert' })
 * - An array of objects with name/value properties
 */
export function formatMetadataValue(value: unknown): string {
  if (!value) return "";

  // Plain string
  if (typeof value === "string") return value;

  // Array of strings or objects
  if (Array.isArray(value)) {
    return value
      .map((item) => formatMetadataValue(item))
      .filter(Boolean)
      .join(", ");
  }

  // Object with properties
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // Check for common name properties
    if ("name" in obj && obj.name) {
      return formatMetadataValue(obj.name);
    }
    if ("value" in obj && obj.value) {
      return formatMetadataValue(obj.value);
    }

    // Language map - use formatLanguageMap helper
    const languageMapResult = formatLanguageMap(value);
    if (languageMapResult) {
      return languageMapResult;
    }
  }

  // Fallback: convert to string
  return String(value);
}

/**
 * Get book title as a string
 */
export function getBookTitle(
  metadata: { title?: unknown } | undefined
): string {
  return formatMetadataValue(metadata?.title) || "Unknown Title";
}

/**
 * Get book author as a string
 */
export function getBookAuthor(
  metadata: { author?: unknown } | undefined
): string {
  return formatMetadataValue(metadata?.author) || "Unknown Author";
}

/**
 * Extracts text content from an HTML document
 */
export function extractTextFromDocument(doc: Document): string {
  // Get the body content
  const body = doc.body;
  if (!body) return "";

  // Clone to avoid modifying original
  const clone = body.cloneNode(true) as HTMLElement;

  // Remove script and style elements
  clone
    .querySelectorAll("script, style, noscript")
    .forEach((el) => el.remove());

  // Get text content and clean it up
  let text = clone.textContent || "";

  // Normalize whitespace
  text = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  return text;
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Find the last space before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Flatten TOC items into an ordered list of hrefs (depth-first)
 */
export function flattenTocHrefs(toc: TOCItem[]): string[] {
  const hrefs: string[] = [];

  const walk = (items: TOCItem[]) => {
    for (const item of items) {
      if (item.href) hrefs.push(item.href);
      if (item.subitems?.length) {
        walk(item.subitems);
      }
    }
  };

  walk(toc);
  return hrefs;
}

/**
 * Build book memory from prior chapter previews (spoiler-safe: only chapters before current)
 */
export function buildBookMemory(
  book: Book | null | undefined,
  chapterPreviews: ChapterPreviews,
  bookId: string | null,
  currentTocHref: string | null
): string {
  if (!book?.toc || !bookId || !currentTocHref) return "";

  const orderedHrefs = flattenTocHrefs(book.toc);
  const currentIndex = orderedHrefs.indexOf(currentTocHref);
  if (currentIndex <= 0) return "";

  const priorHrefs = orderedHrefs.slice(0, currentIndex);
  const sections: string[] = [];

  for (const href of priorHrefs) {
    const previewKey = `${bookId}:${href}`;
    const preview = chapterPreviews[previewKey];
    if (!preview) continue;

    let content = "";
    if (preview.fullSummary) {
      content = preview.fullSummary;
    } else if (preview.themes?.length || preview.keyConcepts?.length) {
      const parts: string[] = [];
      if (preview.themes?.length) {
        parts.push(`Themes: ${preview.themes.join(", ")}`);
      }
      if (preview.keyConcepts?.length) {
        parts.push(`Key concepts: ${preview.keyConcepts.join(", ")}`);
      }
      content = parts.join(". ");
    }

    if (content) {
      sections.push(`### ${preview.chapterLabel}\n${content}`);
    }
  }

  return sections.join("\n\n");
}

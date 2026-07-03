import { formatContributor, formatLanguageMap } from "./formatters";

export const DEFAULT_BOOK_TITLE = "Unknown Title";
export const DEFAULT_BOOK_AUTHOR = "Unknown Author";
export const EPUB_EXTENSION = ".epub";

/**
 * Extracts a string from book metadata values that may be plain strings,
 * language maps, arrays, or contributor objects.
 */
export function formatMetadataValue(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => formatMetadataValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    if ("name" in obj && obj.name) {
      return formatMetadataValue(obj.name);
    }
    if ("value" in obj && obj.value) {
      return formatMetadataValue(obj.value);
    }

    const languageMapResult = formatLanguageMap(value);
    if (languageMapResult) {
      return languageMapResult;
    }
  }

  return String(value);
}

export function getBookTitle(
  metadata: { title?: unknown } | undefined,
  fallback = DEFAULT_BOOK_TITLE
): string {
  return formatMetadataValue(metadata?.title) || fallback;
}

export function getBookAuthor(
  metadata: { author?: unknown } | undefined,
  fallback = DEFAULT_BOOK_AUTHOR
): string {
  const formatted = formatMetadataValue(metadata?.author);
  if (formatted) return formatted;
  return (
    formatContributor(
      metadata?.author as Parameters<typeof formatContributor>[0]
    ) || fallback
  );
}

export function getTitleFromFilename(filename: string): string {
  return filename.replace(EPUB_EXTENSION, "");
}

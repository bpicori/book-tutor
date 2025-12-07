import { formatLanguageMap } from "./formatters";

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

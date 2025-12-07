import type { Book } from "../types";
import { generateReaderCSS } from "./readerStyles";
import type { ReaderSettings } from "../types";

/**
 * Loads and sets the book cover image
 */
export async function loadBookCover(
  book: Book | null,
  setCoverUrl: (url: string | null) => void
): Promise<void> {
  if (!book?.getCover) return;

  try {
    const blob = await book.getCover();
    if (blob) {
      setCoverUrl(URL.createObjectURL(blob));
    }
  } catch (err) {
    console.error("Failed to load cover:", err);
  }
}

/**
 * Updates the document title based on book metadata
 */
export function updateBookTitle(book: Book | null): void {
  if (!book?.metadata?.title) return;

  const title =
    typeof book.metadata.title === "string"
      ? book.metadata.title
      : Object.values(book.metadata.title)[0];

  if (title) {
    document.title = `${title} - Read with AI`;
  }
}

/**
 * Applies CSS styles to the book renderer
 */
export function applyBookStyles(
  renderer: { setStyles?: (styles: string) => void } | null,
  settings: ReaderSettings
): void {
  if (!renderer?.setStyles) return;

  const css = generateReaderCSS(settings);
  renderer.setStyles(css);
}

import type { Book } from "../types";
import { APP_NAME } from "../constants";
import { generateReaderCSS } from "./readerStyles";
import type { ReaderSettings } from "../types";
import { getBookTitle } from "./metadata";

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

export function updateBookTitle(book: Book | null): void {
  if (!book?.metadata?.title) return;

  const title = getBookTitle(book.metadata, "");
  if (title) {
    document.title = `${title} - ${APP_NAME}`;
  }
}

export function applyBookStyles(
  renderer: { setStyles?: (styles: string) => void } | null,
  settings: ReaderSettings
): void {
  if (!renderer?.setStyles) return;
  renderer.setStyles(generateReaderCSS(settings));
}

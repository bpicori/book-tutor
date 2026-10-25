/**
 * The sample book that makes the guide tryable without a file or an API key.
 *
 * The book is a real EPUB (Project Gutenberg, public domain) stored like any
 * other book, so reading, pagination, progress and highlights behave exactly
 * as they do for a book added from disk. Only the guide's model responses are
 * pre-written — see `fixtures.ts`.
 */

/** Fixed id so the demo book can be recognised across reloads. */
export const SAMPLE_BOOK_ID = "sample-the-time-machine";

export interface SampleBookInfo {
  id: string;
  title: string;
  author: string;
  fileName: string;
  /** Served from `public/demo/`, so it respects the Vite base path. */
  url: string;
  source: string;
}

export const SAMPLE_BOOK: SampleBookInfo = {
  id: SAMPLE_BOOK_ID,
  title: "The Time Machine",
  author: "H. G. Wells",
  fileName: "the-time-machine.epub",
  url: `${import.meta.env.BASE_URL}demo/the-time-machine.epub`,
  source: "Project Gutenberg #35",
};

/** True when the open book is the bundled sample. */
export function isSampleBook(bookId: string | null | undefined): boolean {
  return bookId === SAMPLE_BOOK_ID;
}

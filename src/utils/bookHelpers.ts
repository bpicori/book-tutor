import type { Book, ChapterPreviews, TOCItem } from "../types";
import { BOOK_MEMORY_CHAR_BUDGET } from "../constants";
import { makeChapterKey } from "./chapterKeys";
export { getBookTitle, getBookAuthor } from "./metadata";

export function extractTextFromDocument(doc: Document): string {
  const body = doc.body;
  if (!body) return "";

  const clone = body.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("script, style, noscript")
    .forEach((el) => el.remove());

  let text = clone.textContent || "";
  text = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  return text;
}

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
 * Summaries of chapters the reader has already passed, for the Ask AI prompt.
 *
 * The budget is spent on the most recent chapters first, because those are the
 * ones a question about "what came before" usually refers to, then the collected
 * summaries are put back into reading order.
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
  let used = 0;

  for (let i = priorHrefs.length - 1; i >= 0; i--) {
    const href = priorHrefs[i];
    const preview = chapterPreviews[makeChapterKey(bookId, href)];
    if (!preview) continue;

    const content = preview.fullSummary
      ? preview.fullSummary
      : [
          preview.themes?.length ? `Themes: ${preview.themes.join(", ")}` : "",
          preview.keyConcepts?.length
            ? `Key concepts: ${preview.keyConcepts.join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(". ");

    if (!content) continue;

    const section = `### ${preview.chapterLabel}\n${content}`;
    if (used + section.length > BOOK_MEMORY_CHAR_BUDGET) break;

    sections.unshift(section);
    used += section.length;
  }

  return sections.join("\n\n");
}

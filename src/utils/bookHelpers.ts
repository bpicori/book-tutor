import type { Book, ChapterPreviews, TOCItem } from "../types";
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
    const preview = chapterPreviews[makeChapterKey(bookId, href)];
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

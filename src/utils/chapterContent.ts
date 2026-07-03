import type { Book } from "../types";
import { extractTextFromDocument } from "./bookHelpers";

export async function loadChapterText(
  book: Book | null | undefined,
  sectionIndex: number | null,
  chapterLabel: string
): Promise<string> {
  if (book?.sections && sectionIndex !== null && sectionIndex >= 0) {
    const section = book.sections[sectionIndex];
    if (section?.createDocument) {
      try {
        const doc = await section.createDocument();
        return extractTextFromDocument(doc);
      } catch (err) {
        console.warn("Failed to load chapter content:", err);
      }
    }
  }

  return `[Chapter content could not be loaded. Please generate based on the chapter title "${chapterLabel}" and book context.]`;
}

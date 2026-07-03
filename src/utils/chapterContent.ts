import type { Book, TOCItem } from "../types";
import { extractTextFromDocument } from "./bookHelpers";
import { flattenTocWithDepth } from "./tocUtils";

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

function extractTextFromRange(doc: Document, range: Range): string {
  const fragment = range.cloneContents();
  const container = doc.createElement("div");
  container.appendChild(fragment);
  container
    .querySelectorAll("script, style, noscript")
    .forEach((el) => el.remove());
  return normalizeExtractedText(container.textContent || "");
}

function resolveAnchorNode(
  doc: Document,
  anchor: ((doc: Document) => Element | Range | number) | undefined
): Node | null {
  if (!anchor) return doc.body;

  const result = anchor(doc);
  if (result === 0) return doc.body;
  if (result instanceof Range) return result.startContainer;
  if (result instanceof Element) return result;
  return doc.body;
}

function createScopedRange(
  doc: Document,
  startNode: Node,
  endNode: Node | null
): Range {
  const range = doc.createRange();
  const body = doc.body;

  if (startNode === body) {
    range.setStart(body, 0);
  } else {
    range.setStartBefore(startNode);
  }

  if (endNode && endNode !== body) {
    range.setEndBefore(endNode);
  } else if (body?.lastChild) {
    range.setEndAfter(body.lastChild);
  } else if (body) {
    range.setEnd(body, body.childNodes.length);
  }

  return range;
}

export async function loadTocScopedText(
  book: Book | null | undefined,
  toc: TOCItem[] | undefined,
  tocHref: string,
  fallbackLabel: string
): Promise<string> {
  if (!book?.sections || !toc?.length) {
    return `[Chapter content could not be loaded. Please generate based on the chapter title "${fallbackLabel}" and book context.]`;
  }

  const resolved = book.resolveHref?.(tocHref);
  if (!resolved || resolved.index < 0) {
    return `[Chapter content could not be loaded. Please generate based on the chapter title "${fallbackLabel}" and book context.]`;
  }

  const section = book.sections[resolved.index];
  if (!section?.createDocument) {
    return `[Chapter content could not be loaded. Please generate based on the chapter title "${fallbackLabel}" and book context.]`;
  }

  try {
    const doc = await section.createDocument();
    const startNode = resolveAnchorNode(doc, resolved.anchor);

    if (!startNode) {
      return extractTextFromDocument(doc);
    }

    const entries = flattenTocWithDepth(toc);
    const currentIndex = entries.findIndex((entry) => entry.href === tocHref);
    let endNode: Node | null = null;

    if (currentIndex >= 0) {
      for (let i = currentIndex + 1; i < entries.length; i++) {
        const nextEntry = entries[i];
        const nextResolved = book.resolveHref?.(nextEntry.href);
        if (!nextResolved) continue;

        if (nextResolved.index > resolved.index) break;

        if (nextResolved.index === resolved.index) {
          endNode = resolveAnchorNode(doc, nextResolved.anchor);
          break;
        }
      }
    }

    if (!resolved.anchor && !endNode) {
      return extractTextFromDocument(doc);
    }

    const range = createScopedRange(doc, startNode, endNode);
    const text = extractTextFromRange(doc, range);
    if (text) return text;

    return extractTextFromDocument(doc);
  } catch (err) {
    console.warn("Failed to load scoped chapter content:", err);
    return `[Chapter content could not be loaded. Please generate based on the chapter title "${fallbackLabel}" and book context.]`;
  }
}


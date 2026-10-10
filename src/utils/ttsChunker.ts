/**
 * Turns a rendered EPUB section document into the paragraph queue that
 * read-aloud plays.
 *
 * EPUB 2 documents are XHTML 1.1 and EPUB 3 documents are XHTML5, so the
 * semantic paragraph is `<p>`. Real books break that assumption: Calibre and
 * InDesign conversions often wrap paragraphs in `<div class="calibreN">`, use
 * `<br>`-split lines, or put bare text under `div/section/article`. Detection
 * is therefore two-tier — known semantics first, then leaf block fallbacks —
 * and only the innermost blocks are read so nothing is skipped or duplicated.
 */

export interface ReadAloudParagraph {
  /** Covers the paragraph contents; used for highlighting and auto-follow. */
  range: Range;
  /** Normalized plain text sent to the speech provider. */
  text: string;
}

const SEMANTIC_BLOCKS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "blockquote",
  "figcaption",
  "dt",
  "dd",
  "pre",
  "td",
  "th",
]);

const FALLBACK_BLOCKS = new Set(["div", "section", "article"]);

const SKIP_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "nav",
  "aside",
  "svg",
  "head",
  "title",
]);

function isBlockCandidate(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return SEMANTIC_BLOCKS.has(tag) || FALLBACK_BLOCKS.has(tag);
}

function isSkipped(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return true;
  if (el.hasAttribute("hidden")) return true;
  if (el.getAttribute("aria-hidden") === "true") return true;

  const type = (
    el.getAttribute("epub:type") ||
    el.getAttribute("role") ||
    ""
  ).toLowerCase();
  if (type.includes("footnote")) return true;

  const view = el.ownerDocument?.defaultView;
  if (view) {
    try {
      const style = view.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden")
        return true;
    } catch {
      // A detached or cross-origin document: fall back to the tag checks.
    }
  }
  return false;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Text of an element, with `<br>` treated as a space between lines. */
function textOf(el: Element): string {
  let text = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element;
      if (child.tagName.toLowerCase() === "br") text += " ";
      else text += textOf(child);
    }
  }
  return normalize(text);
}

function hasText(el: Element): boolean {
  return textOf(el).length > 0;
}

/** True when a descendant block candidate carries text this element wraps. */
function hasChildBlock(el: Element): boolean {
  for (const child of Array.from(el.children)) {
    if (isSkipped(child)) continue;
    if (isBlockCandidate(child) && hasText(child)) return true;
    if (hasChildBlock(child)) return true;
  }
  return false;
}

function collectBlocks(container: Element, out: Element[]): void {
  for (const child of Array.from(container.children)) {
    if (isSkipped(child)) continue;

    if (isBlockCandidate(child) && hasText(child)) {
      if (hasChildBlock(child)) {
        // A wrapper (nested list, blockquote holding paragraphs): descend.
        collectBlocks(child, out);
      } else {
        out.push(child);
      }
    } else {
      // Structural container (body, main, figure, table): descend.
      collectBlocks(child, out);
    }
  }
}

/**
 * Innermost readable paragraph blocks in document order. Used for the hover
 * affordance and as the leaf pass of paragraph extraction.
 */
export function getParagraphBlocks(doc: Document): Element[] {
  const out: Element[] = [];
  if (doc.body) collectBlocks(doc.body, out);
  return out;
}

/** A Range covering the whole paragraph element. */
export function paragraphRange(doc: Document, el: Element): Range {
  const range = doc.createRange();
  range.selectNodeContents(el);
  return range;
}

/**
 * Direct text nodes that sit inside a skipped wrapper, e.g. the "introduction"
 * before a nested `<ul>` inside an `<li>`. They are read as their own
 * paragraph so no text is lost between child blocks.
 */
function directTextParagraphs(
  doc: Document,
  covered: Set<Node>
): ReadAloudParagraph[] {
  const body = doc.body;
  if (!body) return [];

  const accepted: Text[] = [];
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent || isSkipped(parent)) return NodeFilter.FILTER_REJECT;
      for (let el: Element | null = parent; el; el = el.parentElement) {
        if (covered.has(el)) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    accepted.push(node as Text);
  }

  const paragraphs: ReadAloudParagraph[] = [];
  let runStart: Text | null = null;
  let runEnd: Text | null = null;

  const flush = () => {
    if (!runStart || !runEnd) return;
    const range = doc.createRange();
    range.setStart(runStart, 0);
    range.setEnd(runEnd, runEnd.nodeValue?.length ?? 0);
    const text = normalize(range.toString());
    if (text) paragraphs.push({ range, text });
    runStart = null;
    runEnd = null;
  };

  for (const node of accepted) {
    if (
      runEnd &&
      runEnd.nextSibling === node &&
      node.previousSibling === runEnd
    ) {
      runEnd = node;
    } else {
      flush();
      runStart = node;
      runEnd = node;
    }
  }
  flush();

  return paragraphs;
}

/**
 * Paragraph queue for one section document, in reading order.
 */
export function extractParagraphs(doc: Document): ReadAloudParagraph[] {
  const blocks = getParagraphBlocks(doc);
  const covered = new Set<Node>(blocks);

  const paragraphs: ReadAloudParagraph[] = blocks
    .map((el) => {
      const range = paragraphRange(doc, el);
      return { range, text: textOf(el) };
    })
    .filter((paragraph) => paragraph.text.length > 0);

  paragraphs.push(...directTextParagraphs(doc, covered));

  paragraphs.sort((a, b) =>
    a.range.compareBoundaryPoints(Range.START_TO_START, b.range)
  );

  return paragraphs;
}

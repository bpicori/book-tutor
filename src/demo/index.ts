import type { TOCItem } from "../types";
import { flattenTocWithDepth } from "../utils/tocUtils";
import { hasDemoPreview } from "./fixtures";

export {
  SAMPLE_BOOK,
  SAMPLE_BOOK_ID,
  isSampleBook,
  type SampleBookInfo,
} from "./sampleBook";

export {
  DEMO_DEFINITION_FALLBACK,
  DEMO_QUESTIONS,
  getDemoAnswer,
  getDemoDefinition,
  getDemoPreview,
  hasDemoPreview,
} from "./fixtures";

/** Short line shown in the guide while the sample book is open. */
export const DEMO_NOTICE =
  "Sample book · these answers are pre-written. Connect a model to use the guide on your own books.";

/**
 * Href of the first chapter the sample has a written preview for.
 *
 * The sample is opened at that chapter instead of the cover, so a visitor sees
 * the reader and the guide working before they have clicked anything.
 */
export function findSampleChapterHref(toc: TOCItem[] | null | undefined) {
  if (!toc?.length) return null;

  const entry = flattenTocWithDepth(toc).find((item) =>
    hasDemoPreview(item.label)
  );
  return entry?.href ?? null;
}

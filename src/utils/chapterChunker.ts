import {
  CHAPTER_CONTEXT_CHAR_BUDGET,
  CHAPTER_SPLIT_SEARCH_WINDOW,
} from "../constants";

/**
 * Utilities for intelligently chunking chapter content for summarization
 */

export interface Chunk {
  content: string;
  startIndex: number;
  endIndex: number;
  range: string; // e.g., "0-20%"
}

/**
 * Calculate optimal number of chunks based on chapter length.
 *
 * Anything that fits in one request is left whole: only chapters past the
 * context budget are split. There is no maximum cap on the number of chunks.
 */
export function calculateOptimalChunks(
  chapterLength: number,
  budget = CHAPTER_CONTEXT_CHAR_BUDGET
): number {
  if (chapterLength <= budget) {
    return 1;
  }

  return Math.ceil(chapterLength / budget);
}

/**
 * Split chapter content into chunks at smart boundaries
 * Respects paragraph breaks and section boundaries to avoid cutting mid-sentence
 */
export function splitChapterIntoChunks(
  content: string,
  numChunks: number
): Chunk[] {
  if (numChunks === 1) {
    return [
      {
        content,
        startIndex: 0,
        endIndex: content.length,
        range: "0-100%",
      },
    ];
  }

  const chunks: Chunk[] = [];
  const targetChunkSize = Math.ceil(content.length / numChunks);
  let currentIndex = 0;

  for (let i = 0; i < numChunks; i++) {
    const isLastChunk = i === numChunks - 1;
    const targetEndIndex = isLastChunk
      ? content.length
      : currentIndex + targetChunkSize;

    // Find a good split point near the target
    let splitIndex = findSmartSplitPoint(content, currentIndex, targetEndIndex);

    const chunkContent = content.slice(currentIndex, splitIndex);
    const startPercent = Math.round((currentIndex / content.length) * 100);
    const endPercent = Math.round((splitIndex / content.length) * 100);

    chunks.push({
      content: chunkContent.trim(),
      startIndex: currentIndex,
      endIndex: splitIndex,
      range: `${startPercent}-${endPercent}%`,
    });

    currentIndex = splitIndex;
  }

  return chunks;
}

/**
 * Find a smart split point that respects text boundaries
 * Prefers paragraph breaks, then sentence breaks, then word boundaries
 */
function findSmartSplitPoint(
  content: string,
  startIndex: number,
  targetIndex: number
): number {
  // If we're at the end, use target
  if (targetIndex >= content.length) {
    return content.length;
  }

  // Look for paragraph breaks (double newlines) within a reasonable range
  const searchWindow = Math.min(
    CHAPTER_SPLIT_SEARCH_WINDOW,
    targetIndex - startIndex
  );
  const searchStart = Math.max(startIndex, targetIndex - searchWindow);
  const searchEnd = Math.min(content.length, targetIndex + searchWindow);

  // First, try to find a paragraph break (double newline)
  const paragraphBreak = content.lastIndexOf("\n\n", targetIndex);
  if (paragraphBreak > searchStart && paragraphBreak <= searchEnd) {
    return paragraphBreak + 2; // Include the newlines
  }

  // Then try a single newline (section break)
  const newlineBreak = content.lastIndexOf("\n", targetIndex);
  if (newlineBreak > searchStart && newlineBreak <= searchEnd) {
    return newlineBreak + 1;
  }

  // Finally, try to find a sentence boundary (period, exclamation, question mark)
  const sentenceEnd = content.lastIndexOf(". ", targetIndex);
  if (sentenceEnd > searchStart && sentenceEnd <= searchEnd) {
    return sentenceEnd + 2; // Include the period and space
  }

  // Last resort: word boundary
  const wordBoundary = content.lastIndexOf(" ", targetIndex);
  if (wordBoundary > searchStart) {
    return wordBoundary + 1;
  }

  // If all else fails, use the target index
  return targetIndex;
}

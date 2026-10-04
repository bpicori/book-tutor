/**
 * Prompts used for LLM interactions
 */

import { ROLLING_SUMMARY_CONTEXT_CHARS } from "../constants";

/**
 * System prompt template for chapter chat/ask functionality.
 * Creates a context-aware prompt that helps the AI assist with reading comprehension.
 * @param bookTitle - The title of the book
 * @param bookAuthor - The author of the book
 * @param chapterLabel - The label/name of the current chapter
 * @param chapterContent - The content of the current chapter
 * @returns The formatted system prompt
 */
export function createChatSystemPrompt(
  bookTitle: string,
  bookAuthor: string,
  chapterLabel: string,
  chapterContent: string,
  bookContext?: string
): string {
  const priorChaptersSection = bookContext?.trim()
    ? `
THE BOOK SO FAR (summaries of chapters the reader already previewed):
---
${bookContext}
---
`
    : "";

  return `You are a reading assistant. The reader is reading "${bookTitle}" by ${bookAuthor}.
They are currently in the chapter or section "${chapterLabel}", partway through
the book. The text below is only that part of the book, so do not assume you
have seen the rest of it.
${priorChaptersSection}
TEXT OF "${chapterLabel}":
---
${chapterContent}
---

Use the text above as your primary source. It may be marked with
"OPENING OF THE CHAPTER" and "CLOSING OF THE CHAPTER", with a summary of what
lies between them in the middle. Treat that summary as a description of text
you cannot see, not as text to quote.

Help the reader by:
- Explaining concepts, themes, or plot points
- Clarifying confusing passages
- Connecting ideas to earlier parts of the book
- Analyzing character motivations
- Discussing the deeper meaning or significance

Be concise but thorough. If the reader asks about something specific, focus on
that. If the answer is not in the text above, say so rather than inventing it.`;
}

/**
 * System prompt for generating chapter previews.
 * Guides the AI to create spoiler-free reading previews that help orient readers.
 */
export const CHAPTER_PREVIEW_SYSTEM_PROMPT = `You are an expert reading guide assistant. Your task is to analyze the provided chapter content and generate a reading preview that helps readers prepare for and engage more deeply with the material.

IMPORTANT GUIDELINES:
- For FICTION: Avoid plot spoilers. Focus on themes, tone, atmosphere, and what readers should pay attention to.
- For NON-FICTION: Focus on key arguments, concepts, and frameworks introduced in this chapter.
- Keep each item concise but meaningful (1-2 sentences max per item).
- Generate content that primes the reader's attention without giving away key revelations.
- Base your analysis on the actual chapter content provided.

You must respond with a valid JSON object with the following structure:
{
  "themes": ["theme 1", "theme 2"],
  "keyConcepts": ["concept 1", "concept 2"],
  "toneAndStyle": "Optional: description of tone, pacing, or narrative style",
  "characters": ["Optional: character introductions for fiction"],
  "definitions": [{"term": "term", "definition": "definition"}],
  "guidingQuestions": ["question 1", "question 2"]
}

Required fields: themes, keyConcepts, guidingQuestions
Optional fields: toneAndStyle, characters, definitions

Provide 2-4 items for themes, keyConcepts.
Provide 1-2 guiding questions that help the reader think critically about the content.
Only include characters for fiction works where new or important characters appear.
Only include definitions if there are important terms or concepts that need explanation.`;

/**
 * User prompt template for generating chapter previews.
 * @param bookTitle - The title of the book
 * @param bookAuthor - The author of the book
 * @param chapterLabel - The label/name of the chapter
 * @param truncatedContent - The chapter content (may be truncated)
 * @returns The formatted user prompt
 */
export function createChapterPreviewUserPrompt(
  bookTitle: string,
  bookAuthor: string,
  chapterLabel: string,
  truncatedContent: string
): string {
  return `Generate a reading preview for:

Book: "${bookTitle}" by ${bookAuthor}
Chapter: "${chapterLabel}"

The text below is this one chapter of the book, not the whole book.

CHAPTER CONTENT:
---
${truncatedContent}
---

Based on the chapter content above, create a preview that will help orient and prime the reader. Remember to respond with valid JSON only.`;
}

/**
 * Follow-up prompt used when the model's reply could not be parsed as JSON.
 * @param originalPrompt - The prompt that produced the unusable reply
 * @param failure - Why the reply could not be used
 * @returns The formatted retry prompt
 */
export function createChapterPreviewRetryPrompt(
  originalPrompt: string,
  failure: string
): string {
  return `Your previous reply could not be used (${failure}).

Reply again with a single valid JSON object and nothing else. No markdown, no
code fences, no explanation before or after the object. Keep every string on a
single line and keep the whole object well under 2000 characters.

For reference, this was the original request:

${originalPrompt}`;
}

/**
 * Prompt for getting word definitions/translations.
 * Used when the user selects a word and wants to see its definition or translation.
 * @param word - The word or phrase to define/translate
 * @returns The formatted prompt
 */
export function createWordDefinitionPrompt(word: string): string {
  return `Define "${word}". If non-English, provide English translation and definition. Plain text only.`;
}

/**
 * System prompt for generating rolling summaries of chapter chunks.
 * Each summary builds on the previous one to maintain narrative context.
 */
export const ROLLING_SUMMARY_SYSTEM_PROMPT = `You are a reading assistant that creates concise summaries of sections of a book. You summarize the section you are given, carrying forward only what matters from the sections before it.

IMPORTANT GUIDELINES:
- Create a clear, coherent summary that captures the main ideas, events, and themes of the section you are given
- Fold in the earlier context only where it changes how this section reads; do not restate it in full
- Keep a stable length: the summary replaces the earlier context, it does not add to it
- Focus on key plot points, character development, concepts, or arguments
- Aim for 200-400 words regardless of how long the text so far is
- Keep details that later sections will need to make sense
- Use clear, readable prose`;

/**
 * User prompt template for generating rolling summaries.
 * @param chunkContent - The content of the current chunk to summarize
 * @param previousSummary - The summary of all previous chunks (null for first chunk)
 * @param position - Position indicator (e.g., "0-20%", "20-40%")
 * @returns The formatted user prompt
 */
export function createRollingSummaryPrompt(
  chunkContent: string,
  previousSummary: string | null,
  position: string
): string {
  if (previousSummary) {
    // Only the tail of the running summary is carried, so the prompt stays a
    // fixed size however long the chapter is.
    const carriedContext =
      previousSummary.length > ROLLING_SUMMARY_CONTEXT_CHARS
        ? previousSummary.slice(-ROLLING_SUMMARY_CONTEXT_CHARS)
        : previousSummary;

    return `Summarize the following section of text (${position} of the chapter), carrying forward what still matters from the earlier context:

EARLIER CONTEXT (tail of the running summary):
---
${carriedContext}
---

CURRENT SECTION TO SUMMARIZE:
---
${chunkContent}
---

Write one summary of at most 400 words covering the whole chapter so far. Merge the earlier context into it rather than repeating it.`;
  }

  return `Summarize the following section of text (${position} of the chapter):

---
${chunkContent}
---

Write one summary of at most 400 words that captures the main ideas, events, themes, and important details.`;
}

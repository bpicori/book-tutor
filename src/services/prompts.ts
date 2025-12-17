/**
 * Prompts used for LLM interactions
 */

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
  chapterContent: string
): string {
  return `You are a helpful reading assistant. The user is currently reading "${bookTitle}" by ${bookAuthor}, specifically the chapter "${chapterLabel}".

CHAPTER CONTENT:
---
${chapterContent}
---

Help them understand this chapter by:
- Explaining concepts, themes, or plot points
- Clarifying confusing passages
- Connecting ideas to earlier parts of the book
- Analyzing character motivations
- Discussing the deeper meaning or significance

Be concise but thorough in your responses. If the user asks about something specific, focus your explanation on that. Use the chapter content above as your primary reference when answering questions.`;
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

CHAPTER CONTENT:
---
${truncatedContent}
---

Based on the chapter content above, create a preview that will help orient and prime the reader. Remember to respond with valid JSON only.`;
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
export const ROLLING_SUMMARY_SYSTEM_PROMPT = `You are a reading assistant that creates concise summaries of book chapters. Your task is to summarize the provided section of text, incorporating context from previous sections when available.

IMPORTANT GUIDELINES:
- Create a clear, coherent summary that captures the main ideas, events, and themes
- If previous context is provided, incorporate it naturally to show how this section builds on what came before
- Maintain narrative flow and continuity
- Focus on key plot points, character development, concepts, or arguments
- Keep summaries concise but comprehensive (aim for 200-400 words)
- Preserve important details that will be needed for understanding later sections
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
    return `Summarize the following section of text (${position} of the chapter), building on the previous context:

PREVIOUS CONTEXT:
---
${previousSummary}
---

CURRENT SECTION TO SUMMARIZE:
---
${chunkContent}
---

Create a comprehensive summary that incorporates both the previous context and the new section. The summary should flow naturally and show how this section builds on what came before.`;
  }

  return `Summarize the following section of text (${position} of the chapter):

---
${chunkContent}
---

Create a clear, comprehensive summary that captures the main ideas, events, themes, and important details.`;
}

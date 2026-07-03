import type { ChapterSummary } from "../types";
import type { Chunk } from "../utils/chapterChunker";
import {
  ROLLING_SUMMARY_SYSTEM_PROMPT,
  createRollingSummaryPrompt,
} from "./prompts";
import {
  createClient,
  handleOpenAIError,
  LLMServiceError,
  type LLMSettings,
} from "./llmClient";

export async function generateChapterSummaries(
  chunks: Chunk[],
  settings: LLMSettings,
  onProgress?: (chunkIndex: number, totalChunks: number) => void
): Promise<ChapterSummary[]> {
  const client = createClient(settings);
  const summaries: ChapterSummary[] = [];
  let previousSummary: string | null = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    onProgress?.(i + 1, chunks.length);

    const userPrompt = createRollingSummaryPrompt(
      chunk.content,
      previousSummary,
      chunk.range
    );

    try {
      const response = await client.chat.completions.create({
        model: settings.model,
        messages: [
          { role: "system", content: ROLLING_SUMMARY_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new LLMServiceError(
          `Empty response from AI for chunk ${i + 1}. Please try again.`,
          "EMPTY_RESPONSE"
        );
      }

      const summary: ChapterSummary = {
        range: chunk.range,
        position: {
          start: chunk.startIndex,
          end: chunk.endIndex,
        },
        summary: content.trim(),
      };

      summaries.push(summary);
      previousSummary = content.trim();
    } catch (error) {
      if (error instanceof LLMServiceError) {
        throw error;
      }
      handleOpenAIError(error, settings);
    }
  }

  return summaries;
}

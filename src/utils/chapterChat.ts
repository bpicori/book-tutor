import type { ChatMessage } from "../types";
import {
  CHAT_CONTEXT_CHAR_BUDGET,
  CHAT_HISTORY_CHAR_BUDGET,
} from "../constants";

/**
 * Picks the text the Ask AI prompt should carry.
 *
 * Raw chapter text is preferred: a summary is a lossy description, and the
 * reader is asking about the words on the page. A stored summary is only used
 * when there is no chapter text to load.
 */
export function resolveContentForChat(
  preview:
    | {
        fullSummary?: string;
        summaries?: Array<{ summary: string }>;
      }
    | null
    | undefined,
  chapterContent: string
): string {
  const chapter = chapterContent.trim();

  if (chapter) {
    if (chapter.length > CHAT_CONTEXT_CHAR_BUDGET) {
      return (
        chapter.slice(0, CHAT_CONTEXT_CHAR_BUDGET) +
        "\n\n[Remainder of the chapter omitted for length...]"
      );
    }
    return chapter;
  }

  if (preview?.fullSummary) {
    return preview.fullSummary;
  }

  if (preview?.summaries && preview.summaries.length > 0) {
    return preview.summaries.map((summary) => summary.summary).join("\n\n");
  }

  return "[Chapter text could not be loaded. Answer from the chapter title and the book context, and say when you are unsure.]";
}

/**
 * Builds the message list for a chat request.
 *
 * Only the most recent exchanges are kept, so a long conversation cannot push
 * the chapter text out of the request or grow the cost without bound. The
 * pending message is always last, and it is never dropped.
 */
export function buildConversationHistory(
  chatMessages: ChatMessage[],
  newMessage: string
): ChatMessage[] {
  const pending: ChatMessage = { role: "user", content: newMessage };

  let used = 0;
  const kept: ChatMessage[] = [];

  // Walk backwards from the newest message and stop at the budget.
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const message = chatMessages[i];
    // A reply that is still streaming is not history yet.
    if (message.isStreaming) continue;
    if (!message.content.trim()) continue;

    const size = message.content.length;
    if (used + size > CHAT_HISTORY_CHAR_BUDGET) break;

    kept.unshift({ role: message.role, content: message.content });
    used += size;
  }

  return [...kept, pending];
}

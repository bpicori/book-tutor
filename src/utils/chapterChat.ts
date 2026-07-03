import type { ChatMessage } from "../types";

const MAX_CHAT_CONTENT_LENGTH = 32_000;

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
  if (preview?.fullSummary) {
    return preview.fullSummary;
  }

  if (preview?.summaries && preview.summaries.length > 0) {
    return preview.summaries.map((summary) => summary.summary).join("\n\n");
  }

  if (chapterContent.length > MAX_CHAT_CONTENT_LENGTH) {
    return (
      chapterContent.slice(0, MAX_CHAT_CONTENT_LENGTH) +
      "\n\n[Content truncated for length...]"
    );
  }

  return chapterContent || "[Chapter content could not be loaded]";
}

export function buildConversationHistory(
  chatMessages: ChatMessage[],
  newMessage: string
): ChatMessage[] {
  return [
    ...chatMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user" as const, content: newMessage },
  ];
}

import type OpenAI from "openai";
import type { ChatMessage } from "../types";
import { createChatSystemPrompt } from "./prompts";
import { createClient, handleOpenAIError, type LLMSettings } from "./llmClient";

export async function* streamChat(
  messages: ChatMessage[],
  settings: LLMSettings,
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  const client = createClient(settings);

  const formattedMessages: OpenAI.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    formattedMessages.push({ role: "system", content: systemPrompt });
  }

  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  try {
    const stream = await client.chat.completions.create({
      model: settings.model,
      messages: formattedMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    handleOpenAIError(error, settings);
  }
}

export async function* streamChapterChat(
  bookTitle: string,
  bookAuthor: string,
  chapterLabel: string,
  chapterContent: string,
  messages: ChatMessage[],
  settings: LLMSettings,
  bookContext?: string
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = createChatSystemPrompt(
    bookTitle,
    bookAuthor,
    chapterLabel,
    chapterContent,
    bookContext
  );
  yield* streamChat(messages, settings, systemPrompt);
}

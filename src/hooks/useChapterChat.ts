import { useCallback, useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { streamChapterChat, LLMServiceError } from "../services/llmService";
import {
  getBookTitle,
  getBookAuthor,
  extractTextFromDocument,
} from "../utils/bookHelpers";
import { useLLMAskSettings } from "./useLLMSettings";

/**
 * Hook for managing chapter chat functionality
 * Handles sending messages, streaming responses, and error handling
 */
export function useChapterChat(chapterHref: string, chapterLabel: string) {
  const {
    book,
    currentBookId,
    currentSectionIndex,
    chapterChats,
    chapterPreviews,
    addChatMessage,
    updateLastChatMessage,
    clearChapterChat,
  } = useStore();

  const llmSettings = useLLMAskSettings();
  const chatMessages = chapterChats[chapterHref] || [];
  const [chapterContent, setChapterContent] = useState<string>("");

  // Check if preview with summaries exists for this chapter
  const previewKey = currentBookId
    ? `${currentBookId}:${chapterHref}`
    : chapterHref;
  const preview = chapterPreviews[previewKey];

  // Load chapter content when the chapter changes
  useEffect(() => {
    async function loadChapterContent() {
      if (
        book?.sections &&
        currentSectionIndex !== null &&
        currentSectionIndex >= 0
      ) {
        const section = book.sections[currentSectionIndex];
        if (section?.createDocument) {
          try {
            const doc = await section.createDocument();
            const content = extractTextFromDocument(doc);
            setChapterContent(content);
          } catch (err) {
            console.warn("Failed to load chapter content:", err);
            setChapterContent("");
          }
        }
      }
    }
    loadChapterContent();
  }, [book, currentSectionIndex]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Check if API key is configured
      if (!llmSettings) {
        addChatMessage(chapterHref, {
          role: "assistant",
          content:
            "Please configure your API key in Settings to use the AI assistant.",
        });
        return;
      }

      // Add user message
      addChatMessage(chapterHref, { role: "user", content: message });

      // Add empty assistant message for streaming
      addChatMessage(chapterHref, {
        role: "assistant",
        content: "",
        isStreaming: true,
      });

      // Get book context
      const bookTitle = getBookTitle(book?.metadata);
      const bookAuthor = getBookAuthor(book?.metadata);

      // Use summaries if available, otherwise fallback to truncation
      let contentForChat: string;
      if (preview?.fullSummary) {
        // Use the full rolling summary which has complete context
        contentForChat = preview.fullSummary;
      } else if (preview?.summaries && preview.summaries.length > 0) {
        // Fallback: concatenate all summaries if fullSummary not available
        contentForChat = preview.summaries
          .map((s) => s.summary)
          .join("\n\n");
      } else {
        // Fallback to truncation if no summaries exist
        const maxContentLength = 32000;
        contentForChat =
          chapterContent.length > maxContentLength
            ? chapterContent.slice(0, maxContentLength) +
              "\n\n[Content truncated for length...]"
            : chapterContent || `[Chapter content could not be loaded]`;
      }

      // Get conversation history for this chapter (excluding the empty streaming message we just added)
      const conversationHistory = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      // Add the new user message
      conversationHistory.push({ role: "user" as const, content: message });

      try {
        let fullContent = "";

        for await (const chunk of streamChapterChat(
          bookTitle,
          bookAuthor,
          chapterLabel,
          contentForChat,
          conversationHistory,
          llmSettings
        )) {
          fullContent += chunk;
          updateLastChatMessage(chapterHref, fullContent, true);
        }

        // Mark streaming as complete
        updateLastChatMessage(chapterHref, fullContent, false);
      } catch (error) {
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (error instanceof LLMServiceError) {
          errorMessage = error.message;
        }

        updateLastChatMessage(chapterHref, errorMessage, false);
      }
    },
    [
      chapterHref,
      chapterLabel,
      chapterContent,
      book,
      currentBookId,
      chatMessages,
      preview,
      llmSettings,
      addChatMessage,
      updateLastChatMessage,
    ]
  );

  const clearMessages = useCallback(() => {
    clearChapterChat(chapterHref);
  }, [chapterHref, clearChapterChat]);

  return {
    chatMessages,
    sendMessage,
    clearMessages,
    isLoading: chatMessages.some((msg) => msg.isStreaming),
  };
}

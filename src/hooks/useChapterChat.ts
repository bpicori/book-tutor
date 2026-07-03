import { useCallback, useState, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store/useStore";
import {
  streamChapterChat,
  LLMServiceError,
  formatLLMError,
} from "../services/llmService";
import {
  getBookTitle,
  getBookAuthor,
  buildBookMemory,
} from "../utils/bookHelpers";
import { makeChapterKey } from "../utils/chapterKeys";
import { loadTocScopedText } from "../utils/chapterContent";
import {
  buildConversationHistory,
  resolveContentForChat,
} from "../utils/chapterChat";
import { useLLMAskSettings } from "./useLLMSettings";

interface UseChapterChatOptions {
  chapterHref: string;
  chapterLabel: string;
  previewHref: string;
}

export function useChapterChat({
  chapterHref,
  chapterLabel,
  previewHref,
}: UseChapterChatOptions) {
  const {
    book,
    currentBookId,
    currentTocHref,
    chapterChats,
    chapterPreviews,
    addChatMessage,
    updateLastChatMessage,
    clearChapterChat,
  } = useStore(
    useShallow((state) => ({
      book: state.book,
      currentBookId: state.currentBookId,
      currentTocHref: state.currentTocHref,
      chapterChats: state.chapterChats,
      chapterPreviews: state.chapterPreviews,
      addChatMessage: state.addChatMessage,
      updateLastChatMessage: state.updateLastChatMessage,
      clearChapterChat: state.clearChapterChat,
    }))
  );

  const llmSettings = useLLMAskSettings();
  const chapterKey = makeChapterKey(currentBookId, chapterHref);
  const previewKey = makeChapterKey(currentBookId, previewHref);
  const chatMessages = useMemo(
    () => chapterChats[chapterKey] || [],
    [chapterChats, chapterKey]
  );
  const [chapterContent, setChapterContent] = useState<string>("");

  const preview = chapterPreviews[previewKey];

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      const content = await loadTocScopedText(
        book,
        book?.toc,
        chapterHref,
        chapterLabel
      );
      if (!cancelled) {
        setChapterContent(
          content.startsWith("[Chapter content could not be loaded")
            ? ""
            : content
        );
      }
    }

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [book, book?.toc, chapterHref, chapterLabel]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      if (!llmSettings) {
        addChatMessage(chapterKey, {
          role: "assistant",
          content:
            "Please configure your API key in Settings to use the AI assistant.",
        });
        return;
      }

      addChatMessage(chapterKey, { role: "user", content: message });
      addChatMessage(chapterKey, {
        role: "assistant",
        content: "",
        isStreaming: true,
      });

      const bookTitle = getBookTitle(book?.metadata);
      const bookAuthor = getBookAuthor(book?.metadata);
      const contentForChat = resolveContentForChat(preview, chapterContent);
      const conversationHistory = buildConversationHistory(
        chatMessages,
        message
      );
      const bookContext = buildBookMemory(
        book,
        chapterPreviews,
        currentBookId,
        currentTocHref
      );

      try {
        let fullContent = "";

        for await (const chunk of streamChapterChat(
          bookTitle,
          bookAuthor,
          chapterLabel,
          contentForChat,
          conversationHistory,
          llmSettings,
          bookContext || undefined
        )) {
          fullContent += chunk;
          updateLastChatMessage(chapterKey, fullContent, true);
        }

        updateLastChatMessage(chapterKey, fullContent, false);
      } catch (error) {
        const errorMessage =
          error instanceof LLMServiceError
            ? error.message
            : formatLLMError(error);
        updateLastChatMessage(chapterKey, errorMessage, false);
      }
    },
    [
      chapterKey,
      chapterLabel,
      chapterContent,
      book,
      chatMessages,
      preview,
      llmSettings,
      currentBookId,
      currentTocHref,
      chapterPreviews,
      addChatMessage,
      updateLastChatMessage,
    ]
  );

  const clearMessages = useCallback(() => {
    clearChapterChat(chapterKey);
  }, [chapterKey, clearChapterChat]);

  return {
    chatMessages,
    sendMessage,
    clearMessages,
    isLoading: chatMessages.some((msg) => msg.isStreaming),
  };
}
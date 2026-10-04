import { useCallback, useRef, useMemo } from "react";
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
  /** Preview to take context from, when it covers more than the chat scope. */
  previewHref?: string;
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
  const previewKey = makeChapterKey(currentBookId, previewHref ?? chapterHref);
  const chatMessages = useMemo(
    () => chapterChats[chapterKey]?.messages ?? [],
    [chapterChats, chapterKey]
  );
  const chapterContentRef = useRef<string>("");

  const preview = chapterPreviews[previewKey];

  /**
   * Loads the chapter text for the current chapter, reusing it within a
   * conversation so a send never waits on a repeat read.
   */
  const loadChapterContent = useCallback(async (): Promise<string> => {
    if (chapterContentRef.current) return chapterContentRef.current;

    const content = await loadTocScopedText(
      book,
      book?.toc,
      chapterHref,
      chapterLabel
    );
    const usable = content.startsWith("[Chapter content could not be loaded")
      ? ""
      : content;

    chapterContentRef.current = usable;
    return usable;
    // `book` covers `book.toc`, which the loader reads for scope boundaries.
  }, [book, chapterHref, chapterLabel]);

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

      // Await the chapter text instead of sending an empty context when the
      // reader asks a question before it has finished loading.
      const content = chapterContentRef.current || (await loadChapterContent());
      const contentForChat = resolveContentForChat(preview, content);
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
      loadChapterContent,
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

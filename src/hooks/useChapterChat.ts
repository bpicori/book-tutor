import { useCallback } from "react"
import { useStore } from "../store/useStore"
import { streamChapterChat, LLMServiceError } from "../services/llmService"
import { getBookTitle, getBookAuthor } from "../utils/bookHelpers"
import { useLLMSettings } from "./useLLMSettings"

/**
 * Hook for managing chapter chat functionality
 * Handles sending messages, streaming responses, and error handling
 */
export function useChapterChat(chapterHref: string, chapterLabel: string) {
  const {
    book,
    chapterChats,
    addChatMessage,
    updateLastChatMessage,
    clearChapterChat,
  } = useStore()

  const llmSettings = useLLMSettings()
  const chatMessages = chapterChats[chapterHref] || []

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return

      // Check if API key is configured
      if (!llmSettings) {
        addChatMessage(chapterHref, {
          role: "assistant",
          content:
            "Please configure your API key in Settings to use the AI assistant.",
        })
        return
      }

      // Add user message
      addChatMessage(chapterHref, { role: "user", content: message })

      // Add empty assistant message for streaming
      addChatMessage(chapterHref, {
        role: "assistant",
        content: "",
        isStreaming: true,
      })

      // Get book context
      const bookTitle = getBookTitle(book?.metadata)
      const bookAuthor = getBookAuthor(book?.metadata)

      // Get conversation history for this chapter (excluding the empty streaming message we just added)
      const conversationHistory = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
      // Add the new user message
      conversationHistory.push({ role: "user" as const, content: message })

      try {
        let fullContent = ""

        for await (const chunk of streamChapterChat(
          bookTitle,
          bookAuthor,
          chapterLabel,
          conversationHistory,
          llmSettings,
        )) {
          fullContent += chunk
          updateLastChatMessage(chapterHref, fullContent, true)
        }

        // Mark streaming as complete
        updateLastChatMessage(chapterHref, fullContent, false)
      } catch (error) {
        let errorMessage = "An unexpected error occurred. Please try again."

        if (error instanceof LLMServiceError) {
          errorMessage = error.message
        }

        updateLastChatMessage(chapterHref, errorMessage, false)
      }
    },
    [
      chapterHref,
      chapterLabel,
      book,
      chatMessages,
      llmSettings,
      addChatMessage,
      updateLastChatMessage,
    ],
  )

  const clearMessages = useCallback(() => {
    clearChapterChat(chapterHref)
  }, [chapterHref, clearChapterChat])

  return {
    chatMessages,
    sendMessage,
    clearMessages,
    isLoading: chatMessages.some((msg) => msg.isStreaming),
  }
}

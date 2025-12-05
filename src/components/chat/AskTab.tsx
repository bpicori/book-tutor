import { useState, useRef, useEffect, memo, useCallback } from 'react'
import { useStore } from '../../store/useStore'
import { ChatMessage } from './ChatMessage'
import { streamChat, LLMServiceError } from '../../services/llmService'
import { getBookTitle, getBookAuthor } from '../../utils/bookHelpers'

const QUICK_ACTIONS = [
  { action: 'explain', label: 'Explain this chapter', message: 'Can you explain what happens in this chapter?' },
  { action: 'summary', label: 'Quick summary', message: 'Give me a brief summary of this chapter.' },
  { action: 'connect', label: 'Connect to earlier', message: 'How does this chapter connect to what came before?' },
]

export const AskTab = memo(function AskTab() {
  const {
    book,
    progress,
    currentTocHref,
    chapterChats,
    addChatMessage,
    updateLastChatMessage,
    settings,
  } = useStore()

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chapterLabel = progress.tocLabel || 'Current Chapter'
  const chapterHref = currentTocHref || 'default'
  const chatMessages = chapterChats[chapterHref] || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSubmit = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return

      // Add user message
      addChatMessage(chapterHref, { role: 'user', content: message })
      setInputValue('')

      // Check if API key is configured
      if (!settings.llmApiKey) {
        addChatMessage(chapterHref, {
          role: 'assistant',
          content: 'Please configure your API key in Settings to use the AI assistant.',
        })
        return
      }

      setIsLoading(true)

      // Add empty assistant message for streaming
      addChatMessage(chapterHref, { role: 'assistant', content: '', isStreaming: true })

      const llmSettings = {
        apiKey: settings.llmApiKey,
        baseUrl: settings.llmBaseUrl,
        model: settings.llmModel,
      }

      // Build system prompt with book and chapter context
      const bookTitle = getBookTitle(book?.metadata)
      const bookAuthor = getBookAuthor(book?.metadata)

      const systemPrompt = `You are a helpful reading assistant. The user is currently reading "${bookTitle}" by ${bookAuthor}, specifically the chapter "${chapterLabel}". 

Help them understand this chapter by:
- Explaining concepts, themes, or plot points
- Clarifying confusing passages
- Connecting ideas to earlier parts of the book
- Analyzing character motivations
- Discussing the deeper meaning or significance

Be concise but thorough in your responses. If the user asks about something specific, focus your explanation on that.`

      // Get conversation history for this chapter (excluding the empty streaming message we just added)
      const conversationHistory = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
      // Add the new user message
      conversationHistory.push({ role: 'user' as const, content: message })

      try {
        let fullContent = ''

        for await (const chunk of streamChat(conversationHistory, llmSettings, systemPrompt)) {
          fullContent += chunk
          updateLastChatMessage(chapterHref, fullContent, true)
        }

        // Mark streaming as complete
        updateLastChatMessage(chapterHref, fullContent, false)
      } catch (error) {
        let errorMessage = 'An unexpected error occurred. Please try again.'

        if (error instanceof LLMServiceError) {
          errorMessage = error.message
        }

        updateLastChatMessage(chapterHref, errorMessage, false)
      } finally {
        setIsLoading(false)
      }
    },
    [
      isLoading,
      addChatMessage,
      chapterHref,
      settings,
      book,
      chapterLabel,
      chatMessages,
      updateLastChatMessage,
    ]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(inputValue)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chapter indicator */}
      <div className="flex items-center gap-2 px-4 py-3 bg-hover-warm/30 border-b border-border-warm">
        <span className="material-symbols-outlined text-forest-green text-lg">menu_book</span>
        <span className="text-sm text-muted-gray-text font-medium truncate">{chapterLabel}</span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="flex flex-col gap-4">
          {/* Welcome Message */}
          <div className="flex items-end gap-3">
            <div className="bg-forest-green rounded-full w-8 shrink-0 flex items-center justify-center h-8">
              <span className="material-symbols-outlined text-white text-base">smart_toy</span>
            </div>
            <div className="flex flex-1 flex-col gap-1 items-start">
              <p className="text-light-gray-text text-sm font-medium leading-normal">AI Assistant</p>
              <p className="text-base font-normal leading-normal rounded-lg rounded-bl-none px-4 py-2 bg-hover-warm text-muted-gray-text">
                Ask me anything about this chapter! I can explain passages, clarify concepts, or help
                you understand what you've just read.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          {book && !isLoading && chatMessages.length === 0 && (
            <div className="flex flex-col items-start gap-2 pt-2">
              {QUICK_ACTIONS.map(({ action, label, message }) => (
                <button
                  key={action}
                  onClick={() => handleSubmit(message)}
                  className="text-sm text-forest-green border border-forest-green/50 rounded-full px-3 py-1 hover:bg-forest-green/10 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Chat Messages */}
          {chatMessages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-4 border-t border-border-warm">
        <div className="relative">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full h-12 pl-4 pr-12 text-sm bg-warm-off-white border border-border-warm rounded-lg focus:ring-2 focus:ring-forest-green focus:border-forest-green text-muted-gray-text placeholder-light-gray-text outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={isLoading ? 'AI is thinking...' : 'Ask about this chapter...'}
            type="text"
          />
          <button
            onClick={() => handleSubmit(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-light-gray-text hover:text-forest-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
})


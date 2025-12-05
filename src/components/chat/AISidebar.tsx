import { useState, useRef, useEffect, memo, useCallback } from 'react'
import { useStore } from '../../store/useStore'
import { ChatMessage } from './ChatMessage'
import { streamChat, LLMServiceError } from '../../services/llmService'

const QUICK_ACTIONS = [
  { action: 'summarize', label: 'Summarize this chapter', message: 'Can you summarize this chapter for me?' },
  { action: 'themes', label: 'Explain the main themes', message: 'What are the main themes in this book?' },
  { action: 'characters', label: 'Who are the main characters?', message: 'Who are the main characters and what are their roles?' },
]

export const AISidebar = memo(function AISidebar() {
  const { 
    book, 
    isAiSidebarOpen, 
    toggleAiSidebar, 
    chatMessages, 
    addChatMessage, 
    updateLastChatMessage,
    settings 
  } = useStore()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSubmit = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    // Add user message
    addChatMessage({ role: 'user', content: message })
    setInputValue('')

    // Check if API key is configured
    if (!settings.llmApiKey) {
      addChatMessage({
        role: 'assistant',
        content: 'Please configure your API key in Settings to use the AI assistant.',
      })
      return
    }

    setIsLoading(true)

    // Add empty assistant message for streaming
    addChatMessage({ role: 'assistant', content: '', isStreaming: true })

    const llmSettings = {
      apiKey: settings.llmApiKey,
      baseUrl: settings.llmBaseUrl,
      model: settings.llmModel,
    }

    // Build system prompt with book context
    const bookTitle = book?.metadata?.title || 'the book'
    const bookAuthor = book?.metadata?.author 
      ? Array.isArray(book.metadata.author) 
        ? book.metadata.author.join(', ') 
        : book.metadata.author 
      : 'unknown author'
    
    const systemPrompt = `You are a helpful reading assistant. The user is currently reading "${bookTitle}" by ${bookAuthor}. Help them understand the book, answer questions about its content, themes, characters, and provide insights. Be concise but thorough in your responses.`

    // Get conversation history (excluding the empty streaming message we just added)
    const conversationHistory = chatMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))
    // Add the new user message
    conversationHistory.push({ role: 'user' as const, content: message })

    try {
      let fullContent = ''
      
      for await (const chunk of streamChat(conversationHistory, llmSettings, systemPrompt)) {
        fullContent += chunk
        updateLastChatMessage(fullContent, true)
      }

      // Mark streaming as complete
      updateLastChatMessage(fullContent, false)
    } catch (error) {
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error instanceof LLMServiceError) {
        errorMessage = error.message
      }
      
      updateLastChatMessage(errorMessage, false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, addChatMessage, settings, book, chatMessages, updateLastChatMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(inputValue)
    }
  }

  if (!isAiSidebarOpen) return null

  return (
    <aside className="flex flex-col w-96 h-full bg-warm-off-white border-l border-border-warm overflow-hidden">
      <header className="flex-shrink-0 p-4 border-b border-border-warm flex items-center justify-between">
        <h3 className="text-muted-gray-text font-semibold text-base">AI Assistant</h3>
        <button onClick={() => toggleAiSidebar(false)} className="text-light-gray-text hover:text-forest-green transition-colors">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col p-4 overflow-y-auto scrollbar-thin">
        <div className="flex flex-col gap-4">
          {/* Welcome Message */}
          <div className="flex items-end gap-3">
            <div className="bg-forest-green rounded-full w-8 shrink-0 flex items-center justify-center h-8">
              <span className="material-symbols-outlined text-white text-base">smart_toy</span>
            </div>
            <div className="flex flex-1 flex-col gap-1 items-start">
              <p className="text-light-gray-text text-sm font-medium leading-normal">AI Assistant</p>
              <p className="text-base font-normal leading-normal rounded-lg rounded-bl-none px-4 py-2 bg-hover-warm text-muted-gray-text">
                Hello! How can I help you understand this book?
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          {book && !isLoading && chatMessages.length === 0 && (
            <div className="flex flex-col items-start gap-2 pt-4">
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

      <div className="flex-shrink-0 p-4 border-t border-border-warm">
        <div className="relative">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full h-12 pl-4 pr-12 text-sm bg-warm-off-white border border-border-warm rounded-lg focus:ring-2 focus:ring-forest-green focus:border-forest-green text-muted-gray-text placeholder-light-gray-text outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={isLoading ? 'AI is thinking...' : 'Ask a question...'}
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
    </aside>
  )
})

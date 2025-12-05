import { memo } from 'react'
import type { ChatMessage as ChatMessageType } from '../../types'

interface ChatMessageProps {
  message: ChatMessageType
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const { role, content } = message
  const isUser = role === 'user'

  return (
    <div className={`flex items-end gap-3 ${isUser ? '' : ''}`}>
      {!isUser && (
        <div className="bg-forest-green rounded-full w-8 h-8 shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
        </div>
      )}
      <div className={`flex flex-1 flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <p className="text-light-gray-text text-sm font-medium leading-normal">
          {isUser ? 'You' : 'AI Assistant'}
        </p>
        <p className={`text-base font-normal leading-normal rounded-lg px-4 py-2 ${
          isUser
            ? 'rounded-br-none bg-forest-green text-white'
            : 'rounded-bl-none bg-hover-warm text-muted-gray-text'
        }`}>
          {content}
        </p>
      </div>
      {isUser && (
        <div className="bg-hover-warm rounded-full w-8 h-8 shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-muted-gray-text text-lg">person</span>
        </div>
      )}
    </div>
  )
})


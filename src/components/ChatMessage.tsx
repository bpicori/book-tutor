import type { ChatMessage as ChatMessageType } from '../store/useStore'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { role, content } = message

  if (role === 'user') {
    return (
      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1 items-end">
          <p className="text-light-gray-text text-sm font-medium leading-normal">You</p>
          <p className="text-base font-normal leading-normal rounded-lg rounded-br-none px-4 py-2 bg-forest-green text-white">
            {content}
          </p>
        </div>
        <div className="bg-hover-warm rounded-full w-8 h-8 shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-muted-gray-text text-lg">person</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-3">
      <div className="bg-forest-green rounded-full w-8 h-8 shrink-0 flex items-center justify-center">
        <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 items-start">
        <p className="text-light-gray-text text-sm font-medium leading-normal">AI Assistant</p>
        <p className="text-base font-normal leading-normal rounded-lg rounded-bl-none px-4 py-2 bg-hover-warm text-muted-gray-text">
          {content}
        </p>
      </div>
    </div>
  )
}


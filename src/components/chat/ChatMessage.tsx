import { memo } from "react";
import Markdown from "react-markdown";
import type { ChatMessage as ChatMessageType } from "../../types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const { role, content } = message;
  const isUser = role === "user";

  return (
    <div className={`flex items-end gap-3 ${isUser ? "" : ""}`}>
      {!isUser && (
        <div className="bg-forest-green rounded-full w-8 h-8 shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-lg">
            smart_toy
          </span>
        </div>
      )}
      <div
        className={`flex flex-1 flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
      >
        <p className="text-light-gray-text text-sm font-medium leading-normal">
          {isUser ? "You" : "AI Assistant"}
        </p>
        <div
          className={`text-base font-normal leading-normal rounded-lg px-4 py-2 ${
            isUser
              ? "rounded-br-none bg-forest-green text-white"
              : "rounded-bl-none bg-hover-warm text-muted-gray-text"
          }`}
        >
          {isUser ? (
            content
          ) : (
            <Markdown
              components={{
                // Style paragraphs with proper spacing
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                // Style lists
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 last:mb-0">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 last:mb-0">
                    {children}
                  </ol>
                ),
                // Style code blocks
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  return isBlock ? (
                    <code className="block bg-sepia-bg/50 rounded p-2 my-2 text-sm overflow-x-auto">
                      {children}
                    </code>
                  ) : (
                    <code className="bg-sepia-bg/50 rounded px-1 py-0.5 text-sm">
                      {children}
                    </code>
                  );
                },
                // Style blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-forest-green pl-3 my-2 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content}
            </Markdown>
          )}
        </div>
      </div>
      {isUser && (
        <div className="bg-hover-warm rounded-full w-8 h-8 shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-muted-gray-text text-lg">
            person
          </span>
        </div>
      )}
    </div>
  );
});

import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { ChatMessage as ChatMessageType } from "../../types";
import { chatMarkdownComponents } from "./chatMarkdownComponents";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const { role, content } = message;
  const isUser = role === "user";

  return (
    <div className="flex items-end gap-3">
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
          className={`text-sm font-normal leading-normal rounded-lg px-3 py-2 ${
            isUser
              ? "rounded-br-none bg-forest-green text-white"
              : "rounded-bl-none bg-hover-warm text-muted-gray-text"
          }`}
        >
          {isUser ? (
            content
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={chatMarkdownComponents}
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

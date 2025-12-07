import { useState, useRef, useEffect, memo } from "react";
import { useStore } from "../../store/useStore";
import { ChatMessage } from "./ChatMessage";
import { useChapterChat } from "../../hooks/useChapterChat";

const QUICK_ACTIONS = [
  {
    action: "explain",
    label: "Explain this chapter",
    message: "Can you explain what happens in this chapter?",
  },
  {
    action: "summary",
    label: "Quick summary",
    message: "Give me a brief summary of this chapter.",
  },
  {
    action: "connect",
    label: "Connect to earlier",
    message: "How does this chapter connect to what came before?",
  },
];

export const AskTab = memo(function AskTab() {
  const { progress, currentTocHref, book } = useStore();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chapterLabel = progress.tocLabel || "Current Chapter";
  const chapterHref = currentTocHref || "default";
  const { chatMessages, sendMessage, clearMessages, isLoading } =
    useChapterChat(chapterHref, chapterLabel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSubmit = async (message: string) => {
    if (!message.trim() || isLoading) return;
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      // Cmd+Enter or Shift+Enter: insert new line (let default behavior happen)
      if (e.metaKey || e.ctrlKey || e.shiftKey) {
        return;
      }
      // Enter alone: submit
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chapter indicator */}
      <div className="flex items-center gap-2 px-4 py-3 bg-hover-warm/30 border-b border-border-warm">
        <span className="material-symbols-outlined text-forest-green text-lg">
          menu_book
        </span>
        <span className="text-sm text-muted-gray-text font-medium truncate flex-1">
          {chapterLabel}
        </span>
        {chatMessages.length > 0 && (
          <button
            onClick={clearMessages}
            disabled={isLoading}
            className="flex items-center justify-center w-7 h-7 rounded text-light-gray-text hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear chat"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="flex flex-col gap-4">
          {/* Welcome Message */}
          <div className="flex items-end gap-3">
            <div className="bg-forest-green rounded-full w-8 shrink-0 flex items-center justify-center h-8">
              <span className="material-symbols-outlined text-white text-base">
                smart_toy
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1 items-start">
              <p className="text-light-gray-text text-sm font-medium leading-normal">
                AI Assistant
              </p>
              <p className="text-base font-normal leading-normal rounded-lg rounded-bl-none px-4 py-2 bg-hover-warm text-muted-gray-text">
                Ask me anything about this chapter! I can explain passages,
                clarify concepts, or help you understand what you've just read.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          {book && !isLoading && chatMessages.length === 0 && (
            <div className="flex flex-col items-start gap-2 pt-2">
              {QUICK_ACTIONS.map(({ action, label, message }) => (
                <button
                  key={action}
                  onClick={() => {
                    setInputValue("");
                    sendMessage(message);
                  }}
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
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            className="w-full min-h-12 max-h-32 pl-4 pr-12 py-3 text-sm bg-warm-off-white border border-border-warm rounded-lg focus:ring-2 focus:ring-forest-green focus:border-forest-green text-muted-gray-text placeholder-light-gray-text outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            placeholder={
              isLoading
                ? "AI is thinking..."
                : "Ask about this chapter... (⌘+Enter for new line)"
            }
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={() => handleSubmit(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            className="absolute bottom-0 right-0 flex items-center justify-center w-12 h-12 text-light-gray-text hover:text-forest-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

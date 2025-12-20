import { useState, useRef, useEffect, memo } from "react";
import { useStore } from "../../store/useStore";
import { ChatMessage } from "./ChatMessage";
import { useChapterChat } from "../../hooks/useChapterChat";
import { Button } from "../common";

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const chapterLabel = progress.tocLabel || "Current Chapter";
  const chapterHref = currentTocHref || "default";
  const { chatMessages, sendMessage, clearMessages, isLoading } =
    useChapterChat(chapterHref, chapterLabel);

  // Check if user is near bottom of scroll container
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100; // pixels from bottom
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  // Handle scroll events to track if user manually scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      shouldAutoScrollRef.current = isNearBottom();
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll only if user is near bottom
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;

    const container = messagesContainerRef.current;
    const endElement = messagesEndRef.current;
    if (!container || !endElement) return;

    // Use scrollTop for smoother, more controlled scrolling
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [chatMessages]);

  const handleSubmit = async (message: string) => {
    if (!message.trim() || isLoading) return;
    setInputValue("");
    // Reset auto-scroll when sending a new message
    shouldAutoScrollRef.current = true;
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
          <Button
            variant="ghost"
            onClick={clearMessages}
            disabled={isLoading}
            icon="delete"
            className="w-7 h-7 p-0 hover:text-red-500 hover:bg-red-500/10"
            title="Clear chat"
          />
        )}
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4"
      >
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
            <div className="flex flex-wrap items-start gap-2 pt-2">
              {QUICK_ACTIONS.map(({ action, label, message }) => (
                <Button
                  key={action}
                  variant="pill"
                  onClick={() => {
                    setInputValue("");
                    sendMessage(message);
                  }}
                >
                  {label}
                </Button>
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
          <Button
            variant="icon"
            onClick={() => handleSubmit(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            icon={isLoading ? "progress_activity" : "arrow_upward"}
            className={`absolute right-2 w-9 h-9 hover:translate-y-0 ${
              isLoading ? "[&_span]:animate-spin" : ""
            }`}
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              marginTop: 0,
            }}
            aria-label="Send message"
          />
        </div>
      </div>
    </div>
  );
});

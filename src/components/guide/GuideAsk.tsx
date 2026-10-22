import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useStore } from "../../store/useStore";
import { useCurrentChapter } from "../../hooks/useCurrentChapter";
import { useChapterChat } from "../../hooks/useChapterChat";
import { Icon } from "../ui/Icon";
import { GuideMessage } from "./GuideMessage";

const SUGGESTIONS = [
  {
    label: "Explain this chapter",
    message: "Can you explain what happens in this chapter?",
  },
  {
    label: "Quick summary",
    message: "Give me a brief summary of this chapter.",
  },
  {
    label: "Connect to earlier",
    message: "How does this chapter connect to what came before?",
  },
];

export function GuideAsk() {
  const { chapterLabel, askHref, askLabel, previewHref } = useCurrentChapter();
  const pendingQuote = useStore((state) => state.pendingQuote);
  const setPendingQuote = useStore((state) => state.setPendingQuote);
  const isGuideOpen = useStore((state) => state.isAiSidebarOpen);

  const { chatMessages, sendMessage, clearMessages, isLoading } =
    useChapterChat({
      chapterHref: askHref,
      chapterLabel: askLabel,
      previewHref,
    });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    if (!pendingQuote) return;
    setInput(pendingQuote);
    setPendingQuote(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [pendingQuote, setPendingQuote]);

  useEffect(() => {
    if (!isGuideOpen || !shouldAutoScroll.current) return;
    requestAnimationFrame(() => {
      const stream = streamRef.current;
      if (stream) stream.scrollTop = stream.scrollHeight;
    });
  }, [chatMessages, isGuideOpen]);

  const submit = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isLoading) return;
      setInput("");
      shouldAutoScroll.current = true;
      await sendMessage(trimmed);
    },
    [isLoading, sendMessage]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;
    if (event.shiftKey || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    void submit(input);
  };

  const handleScroll = () => {
    const stream = streamRef.current;
    if (!stream) return;
    shouldAutoScroll.current =
      stream.scrollHeight - stream.scrollTop - stream.clientHeight < 100;
  };

  return (
    <>
      <div className="guide-toolbar" style={{ padding: "14px 24px 0" }}>
        <p className="guide-note">{chapterLabel}</p>
        {chatMessages.length > 0 && (
          <button
            type="button"
            className="guide-action"
            onClick={clearMessages}
            disabled={isLoading}
          >
            Clear
          </button>
        )}
      </div>

      <div className="ask-stream" ref={streamRef} onScroll={handleScroll}>
        {chatMessages.length === 0 && (
          <div className="ask-intro">
            <h3>Ask about this chapter.</h3>
            <p>
              The guide answers from {chapterLabel}, so nothing ahead of your
              place is spoiled.
            </p>
            <div className="suggest">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => void submit(suggestion.message)}
                >
                  {suggestion.label}
                  <span aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((message, index) => (
          <GuideMessage key={index} message={message} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="ask-compose">
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(input);
          }}
        >
          <label className="sr-only" htmlFor="ask-input">
            Ask the guide
          </label>
          <textarea
            ref={inputRef}
            id="ask-input"
            rows={1}
            value={input}
            placeholder="Ask about this chapter…"
            disabled={isLoading}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            aria-label="Send question"
            disabled={isLoading || !input.trim()}
          >
            <Icon name="arrowRight" size={14} />
          </button>
        </form>
        <p className="ask-hint">Enter to send · Shift+Enter for a new line</p>
      </div>
    </>
  );
}

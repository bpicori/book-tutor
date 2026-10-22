import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { ChatMessage as ChatMessageType } from "../../types";

interface GuideMessageProps {
  message: ChatMessageType;
}

export function GuideMessage({ message }: GuideMessageProps) {
  if (message.role === "user") {
    return <div className="msg-user">{message.content}</div>;
  }

  return (
    <div className="msg-ai">
      <p className="who">Guide</p>
      {message.content ? (
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {message.content}
        </Markdown>
      ) : (
        <div className="typing" aria-label="The guide is thinking">
          <i />
          <i />
          <i />
        </div>
      )}
      {message.isStreaming && message.content && (
        <div className="typing" aria-label="The guide is still writing">
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}

import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
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
              components={{
                // Style headings
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold text-muted-gray-text mt-3 mb-2 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold text-muted-gray-text mt-3 mb-2 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-muted-gray-text mt-3 mb-1.5 first:mt-0">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm font-semibold text-muted-gray-text mt-2 mb-1.5 first:mt-0">
                    {children}
                  </h4>
                ),
                h5: ({ children }) => (
                  <h5 className="text-xs font-semibold text-muted-gray-text mt-2 mb-1 first:mt-0">
                    {children}
                  </h5>
                ),
                h6: ({ children }) => (
                  <h6 className="text-xs font-medium text-muted-gray-text mt-2 mb-1 first:mt-0">
                    {children}
                  </h6>
                ),
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
                // Style tables
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 -mx-2">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full border-collapse border-separate border-spacing-0">
                        {children}
                      </table>
                    </div>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-hover-warm/50">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="bg-white/50">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="border-b border-border-warm last:border-b-0 hover:bg-hover-warm/30 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="border border-border-warm px-3 py-2 text-xs text-left font-semibold text-muted-gray-text align-top whitespace-nowrap">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border-warm px-3 py-2 text-xs text-muted-gray-text align-top break-words">
                    <div className="prose prose-sm max-w-none [&_br]:block [&_br]:h-1.5">
                      {children}
                    </div>
                  </td>
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

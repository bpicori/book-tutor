import type { Components } from "react-markdown";

export const chatMarkdownComponents: Components = {
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
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-2 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-2 last:mb-0">{children}</ol>
  ),
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
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-forest-green pl-3 my-2 italic">
      {children}
    </blockquote>
  ),
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
  tbody: ({ children }) => <tbody className="bg-white/50">{children}</tbody>,
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
};

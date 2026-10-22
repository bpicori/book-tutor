import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SavedWord } from "../../types";
import { formatShortDate } from "../../utils/formatDates";

interface WordRowProps {
  word: SavedWord;
  onToggleKnown: (known: boolean) => void;
  onRemove: () => void;
}

export function WordRow({ word, onToggleKnown, onRemove }: WordRowProps) {
  return (
    <article className="word-row">
      <div className="word-head">
        <h3>{word.word}</h3>
        <p className="word-pos">
          {word.known ? (
            <>
              <span className="known-dot" aria-label="Known" />
              Known
            </>
          ) : (
            "To review"
          )}
        </p>
      </div>
      <div>
        <div className="word-def">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{ p: ({ children }) => <>{children}</> }}
          >
            {word.definition}
          </Markdown>
        </div>
        <p className="word-source">
          {word.bookTitle || "Your library"} · {formatShortDate(word.savedAt)}
        </p>
      </div>
      <div className="word-actions">
        <button
          type="button"
          className={`know-btn${word.known ? " is-known" : ""}`}
          aria-pressed={word.known}
          aria-label={
            word.known
              ? `Return ${word.word} to review`
              : `Mark ${word.word} known`
          }
          onClick={() => onToggleKnown(!word.known)}
        >
          {word.known ? "Known" : "Mark known"}
        </button>
        <button
          type="button"
          className="remove-btn"
          aria-label={`Remove ${word.word}`}
          title="Remove word"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
    </article>
  );
}

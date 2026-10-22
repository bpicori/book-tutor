import type { Highlight } from "../../types";
import { getHighlightHex } from "../../constants";
import { Icon } from "../ui/Icon";

interface NoteListProps {
  highlights: Highlight[];
  onNavigate: (highlight: Highlight) => void;
  onDelete: (highlight: Highlight) => void;
}

export function NoteList({ highlights, onNavigate, onDelete }: NoteListProps) {
  if (highlights.length === 0) {
    return (
      <p className="toc-empty">
        No highlights yet. Select text while reading and choose Highlight.
      </p>
    );
  }

  return (
    <div className="note-list">
      {highlights.map((highlight) => (
        <div
          key={highlight.id}
          className="note-card"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate(highlight)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onNavigate(highlight);
            }
          }}
        >
          <p className="note-quote">
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: getHighlightHex(highlight.color),
                marginRight: 7,
                verticalAlign: "middle",
              }}
              aria-hidden="true"
            />
            “{highlight.text}”
          </p>
          {highlight.note && <p className="note-label">{highlight.note}</p>}
          <p className="note-label">
            {highlight.chapterLabel || "Highlight"} ·{" "}
            {new Date(highlight.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
          <button
            type="button"
            className="note-delete"
            aria-label="Delete highlight"
            title="Delete highlight"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(highlight);
            }}
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

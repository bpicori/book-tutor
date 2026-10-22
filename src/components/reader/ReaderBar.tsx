import { useEffect, useRef, useState } from "react";
import { BookCover } from "../ui/Cover";
import { useBookmarks } from "../../hooks/useBookmarks";
import { useToast } from "../ui/Toast";
import { IconButton } from "../ui/IconButton";
import { Icon } from "../ui/Icon";
import { TypePopover } from "./TypePopover";

interface ReaderBarProps {
  title: string;
  coverUrl: string | null;
  chapterLabel: string;
  percent: number;
  contentsOpen: boolean;
  guideOpen: boolean;
  listening: boolean;
  canListen: boolean;
  onToggleContents: () => void;
  onToggleGuide: () => void;
  onListen: () => void;
}

export function ReaderBar({
  title,
  coverUrl,
  chapterLabel,
  percent,
  contentsOpen,
  guideOpen,
  listening,
  canListen,
  onToggleContents,
  onToggleGuide,
  onListen,
}: ReaderBarProps) {
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const { isCurrentPageBookmarked, canBookmark, toggleBookmark } =
    useBookmarks();
  const showToast = useToast();

  const handleBookmark = () => {
    if (!canBookmark) return;
    toggleBookmark();
    showToast({
      message: isCurrentPageBookmarked
        ? "Bookmark removed."
        : "Bookmark set on this page.",
    });
  };

  useEffect(() => {
    if (!typeOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setTypeOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTypeOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [typeOpen]);

  return (
    <header className="reader-bar">
      <div className="reader-bar-in">
        <div className="reader-book">
          <div className="rb-thumb">
            <BookCover src={coverUrl} title={title} />
          </div>
          <div>
            <p className="rb-title">{title}</p>
            <p className="rb-meta">
              {chapterLabel} · {percent}%
            </p>
          </div>
        </div>

        <div className="reader-tools">
          <IconButton
            icon="contents"
            label={contentsOpen ? "Close contents" : "Open contents"}
            text="Contents"
            active={contentsOpen}
            aria-expanded={contentsOpen}
            onClick={onToggleContents}
          />

          <div className="tool-wrap" ref={typeRef}>
            <button
              type="button"
              className={`tool${typeOpen ? " is-on" : ""}`}
              aria-label="Reading settings"
              aria-expanded={typeOpen}
              title="Reading settings"
              onClick={() => setTypeOpen((value) => !value)}
            >
              <span className="aa">Aa</span>
            </button>
            {typeOpen && <TypePopover />}
          </div>

          <button
            type="button"
            id="bookmark"
            className={`tool${isCurrentPageBookmarked ? " is-on" : ""}`}
            onClick={handleBookmark}
            disabled={!canBookmark}
            aria-label={
              isCurrentPageBookmarked
                ? "Remove the bookmark from this page"
                : "Bookmark this page"
            }
            aria-pressed={isCurrentPageBookmarked}
            title={
              isCurrentPageBookmarked
                ? "Remove the bookmark from this page"
                : "Bookmark this page"
            }
          >
            <Icon name="bookmark" size={15} />
          </button>

          <button
            type="button"
            className={`tool${listening ? " is-on" : ""}`}
            onClick={onListen}
            aria-label={listening ? "Stop listening" : "Listen to this chapter"}
            title={listening ? "Stop listening" : "Listen"}
            disabled={!canListen}
          >
            <Icon name="headphones" size={15} />
            <span className="lbl">{listening ? "Stop" : "Listen"}</span>
          </button>

          <span className="tool-sep" aria-hidden="true" />

          <button
            type="button"
            className={`tool${guideOpen ? " is-on" : ""}`}
            data-open-guide="true"
            aria-label={
              guideOpen ? "Close reading guide" : "Open reading guide"
            }
            aria-expanded={guideOpen}
            title="Reading guide"
            onClick={onToggleGuide}
          >
            <span className="guide-dot" aria-hidden="true" />
            <span className="lbl">Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
}

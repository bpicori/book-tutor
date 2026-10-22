import type { LibraryBook } from "../../types";
import { formatRelativeDate, toPercent } from "../../utils/formatDates";
import { BookCover } from "../ui/Cover";
import { Icon } from "../ui/Icon";
import { Track } from "../ui/Track";

interface LibraryRowProps {
  book: LibraryBook;
  onOpen: () => void;
}

export function LibraryRow({ book, onOpen }: LibraryRowProps) {
  const percent = toPercent(book.progress);
  const state =
    book.progress >= 1
      ? "Finished"
      : book.progress <= 0
        ? "Not started"
        : "Reading";
  const lastOpened =
    book.progress >= 1 ? "Finished" : formatRelativeDate(book.lastReadAt);

  return (
    <button
      type="button"
      className="book-row"
      onClick={onOpen}
      aria-label={`${book.title} by ${book.author}, ${state}, ${percent} percent`}
    >
      <div className="book-thumb">
        <BookCover src={book.coverDataUrl} title={book.title} />
      </div>
      <div className="book-info">
        <p className="book-title">{book.title}</p>
        <p className="book-author">{book.author}</p>
      </div>
      <div className="book-progress">
        <div className="progress-meta">
          <span>{state}</span>
          <span>{percent}%</span>
        </div>
        <Track value={percent} />
      </div>
      <div className="book-meta">{lastOpened}</div>
      <div className="row-arrow" aria-hidden="true">
        <Icon name="arrowRight" size={15} />
      </div>
    </button>
  );
}

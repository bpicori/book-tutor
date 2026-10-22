import type { LibraryBook } from "../../types";
import { formatRelativeDate, toPercent } from "../../utils/formatDates";
import { BookCover } from "../ui/Cover";
import { Button } from "../ui/Button";
import { Track } from "../ui/Track";

interface LibraryHeroProps {
  book: LibraryBook;
  onContinue: () => void;
  onPreview: () => void;
}

export function LibraryHero({ book, onContinue, onPreview }: LibraryHeroProps) {
  const percent = toPercent(book.progress);

  return (
    <section className="now" aria-label="Currently reading">
      <div className="now-cover">
        <BookCover src={book.coverDataUrl} title={book.title} />
      </div>
      <div className="now-copy">
        <p className="eyebrow">Continue reading</p>
        <h2>{book.title}</h2>
        <p className="byline">{book.author}</p>
        {book.description && <p className="quote">{book.description}</p>}
        <div className="now-progress">
          <div className="progress-meta">
            <span>
              {book.lastReadAt
                ? `Last read ${formatRelativeDate(book.lastReadAt).toLowerCase()}`
                : "Not started"}
            </span>
            <span>
              <strong>{percent}%</strong> read
            </span>
          </div>
          <Track value={percent} accent />
        </div>
        <div className="now-actions">
          <Button variant="primary" onClick={onContinue}>
            {book.progress > 0 ? "Continue reading" : "Start reading"}
          </Button>
          <Button variant="quiet" onClick={onPreview} arrow>
            Chapter preview
          </Button>
        </div>
      </div>
    </section>
  );
}

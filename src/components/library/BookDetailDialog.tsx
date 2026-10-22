import { useEffect, useState } from "react";
import type { LibraryBook } from "../../types";
import { formatRelativeDate, toPercent } from "../../utils/formatDates";
import { BookCover } from "../ui/Cover";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface BookDetailDialogProps {
  book: LibraryBook | null;
  removing: boolean;
  onClose: () => void;
  onOpen: (book: LibraryBook) => void;
  onRemove: (book: LibraryBook) => void;
}

export function BookDetailDialog({
  book,
  removing,
  onClose,
  onOpen,
  onRemove,
}: BookDetailDialogProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    setConfirmRemove(false);
  }, [book?.id]);

  if (!book) return null;

  const percent = toPercent(book.progress);
  const lastRead = formatRelativeDate(book.lastReadAt);

  return (
    <Dialog
      open
      onClose={onClose}
      eyebrow={book.lastReadAt ? "In your library" : "On your shelf"}
      title={book.title}
      footer={
        confirmRemove ? (
          <>
            <Button
              variant="quiet"
              onClick={() => setConfirmRemove(false)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={removing}
              onClick={() => onRemove(book)}
            >
              Remove this book
            </Button>
          </>
        ) : (
          <>
            <Button variant="quiet" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="quiet"
              className="danger-text"
              onClick={() => setConfirmRemove(true)}
            >
              Remove
            </Button>
            <Button variant="primary" onClick={() => onOpen(book)}>
              {book.progress > 0 ? "Continue reading" : "Start reading"}
            </Button>
          </>
        )
      }
    >
      <div className="bd-book">
        <div className="bd-cover">
          <BookCover
            src={book.coverDataUrl}
            title={book.title}
            fallbackClassName="bd-fallback"
          />
        </div>
        <div>
          <p className="bd-author">{book.author}</p>
          <p className="bd-meta">
            <span>{percent}% through</span>
            <span>{lastRead}</span>
            <span>Added {formatRelativeDate(book.addedAt)}</span>
          </p>
          <div className="bd-track">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
      {confirmRemove && (
        <p className="bd-note">
          This removes the book file and its saved reading position from this
          browser. Exported backups are not affected.
        </p>
      )}
    </Dialog>
  );
}

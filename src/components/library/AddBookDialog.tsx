import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { useAddBook, type BookDraft } from "../../hooks/useAddBook";
import { useSampleBook } from "../../hooks/useSampleBook";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, TextInput } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Spinner } from "../ui/Spinner";
import { useToast } from "../ui/Toast";

interface AddBookDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the new book id, so the caller can open it. */
  onOpenBook?: (bookId: string) => void;
}

export function AddBookDialog({
  open,
  onClose,
  onOpenBook,
}: AddBookDialogProps) {
  const { inspectBook, commitBook, isInspecting, isAdding, error, clearError } =
    useAddBook();
  const { loadSampleBook, isLoading: sampleLoading } = useSampleBook();
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<BookDraft | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(null);
    setTitle("");
    setAuthor("");
    setDragging(false);
    clearError();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, clearError]);

  const acceptFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setDraft(null);
      clearError();
      const nextDraft = await inspectBook(file);
      if (!nextDraft) return;
      setDraft(nextDraft);
      setTitle(nextDraft.title);
      setAuthor(nextDraft.author);
    },
    [inspectBook, clearError]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      void acceptFile(event.dataTransfer.files?.[0]);
    },
    [acceptFile]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!draft || !title.trim() || isAdding || isInspecting) return;

      const book = await commitBook(draft, {
        title: title.trim(),
        author: author.trim(),
      });
      if (!book) return;

      showToast({ message: `“${book.title}” added to your library.` });
      onClose();
    },
    [
      draft,
      title,
      author,
      isAdding,
      isInspecting,
      commitBook,
      showToast,
      onClose,
    ]
  );

  const handleSample = useCallback(async () => {
    const book = await loadSampleBook();
    if (!book) return;
    onClose();
    onOpenBook?.(book.id);
  }, [loadSampleBook, onClose, onOpenBook]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="New book"
      title="Add a book"
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-book-form"
            loading={isAdding}
            disabled={!draft || !title.trim() || isInspecting}
          >
            Add to library
          </Button>
        </>
      }
    >
      <form id="add-book-form" onSubmit={handleSubmit}>
        <div
          className={`drop${dragging ? " is-over" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={handleDrop}
        >
          {isInspecting ? (
            <Spinner label="Reading EPUB metadata" />
          ) : (
            <Icon name="upload" size={22} />
          )}
          <strong>
            {isInspecting ? "Reading the EPUB…" : "Drop an EPUB here"}
          </strong>
          <span>or choose one from your device</span>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isInspecting || isAdding}
          >
            Choose an EPUB
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,application/epub+zip"
            hidden
            onChange={(event) => {
              void acceptFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        {draft && (
          <p className="file-line">
            <b>{draft.file.name}</b>
            <span>{Math.max(1, Math.round(draft.file.size / 1024))} KB</span>
          </p>
        )}

        {draft && (
          <div className="form-grid">
            <Field label="Title" htmlFor="add-title" span2>
              <TextInput
                id="add-title"
                value={title}
                autoComplete="off"
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <Field label="Author" htmlFor="add-author" span2>
              <TextInput
                id="add-author"
                value={author}
                placeholder="Optional"
                autoComplete="off"
                onChange={(event) => setAuthor(event.target.value)}
              />
            </Field>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <p className="note">
          EPUB only. Nothing is uploaded.{" "}
          <button
            type="button"
            className="link-inline"
            onClick={() => void handleSample()}
            disabled={sampleLoading}
          >
            {sampleLoading ? "Loading the sample…" : "Or open the sample book"}
          </button>
        </p>
      </form>
    </Dialog>
  );
}

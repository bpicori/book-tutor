import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SavedWord } from "../../types";
import { Button } from "../ui/Button";

interface PracticeCardProps {
  words: SavedWord[];
  onMarkKnown: (wordId: string) => void;
  onReviewAll: () => void;
}

export function PracticeCard({
  words,
  onMarkKnown,
  onReviewAll,
}: PracticeCardProps) {
  const queue = useMemo(
    () =>
      words.filter((word) => !word.known).sort((a, b) => b.savedAt - a.savedAt),
    [words]
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = queue[index] ?? null;
  const currentId = current?.id;
  const knownCount = words.filter((word) => word.known).length;
  const progress = words.length
    ? Math.round((knownCount / words.length) * 100)
    : 0;

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
  }, [queue.length]);

  useEffect(() => {
    setRevealed(false);
  }, [currentId]);

  if (words.length === 0) {
    return (
      <aside
        className="practice practice-empty"
        aria-label="Vocabulary practice"
      >
        <p className="eyebrow">Practice</p>
        <h2>Nothing to review yet.</h2>
        <p className="practice-hidden">
          Select a word while reading and save it to the lexicon. It will show
          up here for practice.
        </p>
      </aside>
    );
  }

  if (queue.length === 0) {
    return (
      <aside className="practice" aria-label="Vocabulary practice">
        <div className="practice-done">
          <p className="eyebrow">Practice</p>
          <h2>All caught up.</h2>
          <p className="practice-hidden">
            Every saved word is marked known. New words arrive from your
            reading.
          </p>
          <Button variant="secondary" onClick={onReviewAll}>
            Review everything again
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="practice" aria-label="Vocabulary practice">
      <div className="practice-top">
        <p className="eyebrow">Practice</p>
        <p className="meta">{queue.length} to review</p>
      </div>
      <h2>{current?.word}</h2>
      <p className="word-pos">Definition {revealed ? "shown" : "hidden"}</p>
      {revealed ? (
        <div className="practice-def">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{ p: ({ children }) => <>{children}</> }}
          >
            {current?.definition ?? ""}
          </Markdown>
        </div>
      ) : (
        <p className="practice-hidden">Definition hidden until you ask.</p>
      )}
      <div className="practice-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="practice-actions">
        {!revealed ? (
          <Button variant="primary" onClick={() => setRevealed(true)}>
            Show definition
          </Button>
        ) : (
          <div className="practice-rate">
            <Button
              variant="secondary"
              onClick={() => {
                setIndex((value) => (value + 1) % queue.length);
                setRevealed(false);
              }}
            >
              Again
            </Button>
            <Button
              variant="primary"
              onClick={() => current && onMarkKnown(current.id)}
            >
              Knew it
            </Button>
          </div>
        )}
      </div>
      <p className="practice-note">
        Knew it retires the word from review. Again keeps it in rotation.
      </p>
    </aside>
  );
}

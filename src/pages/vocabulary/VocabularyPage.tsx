import { memo, useCallback, useMemo, useState } from "react";
import { useStore } from "../../store/useStore";
import { Chip } from "../../components/ui/Chip";
import { SearchField } from "../../components/ui/SearchField";
import { Page, PageHeader } from "../../components/layout/Page";
import { useToast } from "../../components/ui/Toast";
import { PracticeCard } from "../../components/vocabulary/PracticeCard";
import { WordRow } from "../../components/vocabulary/WordRow";

type WordFilter = "all" | "review" | "known";

export const VocabularyPage = memo(function VocabularyPage() {
  const words = useStore((state) => state.words);
  const removeWord = useStore((state) => state.removeWord);
  const restoreWord = useStore((state) => state.restoreWord);
  const setWordKnown = useStore((state) => state.setWordKnown);
  const showToast = useToast();

  const [filter, setFilter] = useState<WordFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: words.length,
      review: words.filter((word) => !word.known).length,
      known: words.filter((word) => word.known).length,
    }),
    [words]
  );

  const groups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = words
      .filter((word) => {
        if (filter === "review" && word.known) return false;
        if (filter === "known" && !word.known) return false;
        if (
          normalizedQuery &&
          !`${word.word} ${word.definition}`
            .toLowerCase()
            .includes(normalizedQuery)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.word.localeCompare(b.word));

    const result = new Map<string, typeof filtered>();
    for (const word of filtered) {
      const letter = word.word[0]?.toUpperCase() ?? "#";
      const list = result.get(letter) ?? [];
      list.push(word);
      result.set(letter, list);
    }
    return Array.from(result.entries());
  }, [words, filter, query]);

  const handleRemove = useCallback(
    (wordId: string) => {
      const index = words.findIndex((word) => word.id === wordId);
      if (index < 0) return;
      const removed = words[index];
      removeWord(wordId);
      showToast({
        message: `“${removed.word}” removed.`,
        actionLabel: "Undo",
        onAction: () => restoreWord(removed, index),
      });
    },
    [words, removeWord, restoreWord, showToast]
  );

  const handleReviewAll = useCallback(() => {
    for (const word of words) {
      if (word.known) setWordKnown(word.id, false);
    }
    showToast({ message: "All words are back in review." });
  }, [words, setWordKnown, showToast]);

  const hasWords = words.length > 0;
  const hasMatches = groups.length > 0;

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            Lexicon · {words.length} word{words.length === 1 ? "" : "s"}
          </>
        }
        title="Words you kept."
        lead="Saved while reading, with the chapter still attached. Review them without leaving the page."
      />

      <div className="vocab-tools">
        <div className="chips" role="group" aria-label="Filter words">
          <Chip
            active={filter === "all"}
            count={counts.all}
            onClick={() => setFilter("all")}
          >
            All
          </Chip>
          <Chip
            active={filter === "review"}
            count={counts.review}
            onClick={() => setFilter("review")}
          >
            To review
          </Chip>
          <Chip
            active={filter === "known"}
            count={counts.known}
            onClick={() => setFilter("known")}
          >
            Known
          </Chip>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Find a word"
          label="Search vocabulary"
        />
      </div>

      <div className="vocab-layout">
        <div className="vocab-list">
          {!hasWords && (
            <p className="empty-words">
              No words yet. Select a word while reading and save it to the
              lexicon.
            </p>
          )}
          {hasWords && !hasMatches && (
            <p className="empty-words">No words match that.</p>
          )}
          {groups.map(([letter, list]) => (
            <div key={letter}>
              <div className="letter-head">
                <span>{letter}</span>
              </div>
              {list.map((word) => (
                <WordRow
                  key={word.id}
                  word={word}
                  onToggleKnown={(known) => setWordKnown(word.id, known)}
                  onRemove={() => handleRemove(word.id)}
                />
              ))}
            </div>
          ))}
        </div>

        <PracticeCard
          words={words}
          onMarkKnown={(wordId) => {
            const word = words.find((entry) => entry.id === wordId);
            setWordKnown(wordId, true);
            if (word) {
              showToast({ message: `“${word.word}” marked known.` });
            }
          }}
          onReviewAll={handleReviewAll}
        />
      </div>
    </Page>
  );
});

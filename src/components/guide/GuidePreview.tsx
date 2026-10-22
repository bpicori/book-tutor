import { Button } from "../ui/Button";
import { useCurrentChapter } from "../../hooks/useCurrentChapter";
import { useChapterPreview } from "../../hooks/useChapterPreview";
import { useAskQuestion } from "../../hooks/useAskQuestion";
import type { ChapterPreview } from "../../types";

function summaryOf(preview: ChapterPreview): string {
  if (preview.fullSummary?.trim()) return preview.fullSummary;
  return (
    preview.summaries
      ?.map((summary) => summary.summary)
      .filter(Boolean)
      .join("\n\n") ?? ""
  );
}

export function GuidePreview() {
  const { chapterLabel, previewHref, previewLabel } = useCurrentChapter();
  const askQuestion = useAskQuestion();
  const {
    preview,
    isLoading,
    error,
    progress,
    generatePreview,
    refreshPreview,
  } = useChapterPreview(previewHref, previewLabel);

  if (isLoading) {
    return (
      <div className="guide-scroll">
        <div className="guide-progress">
          <span className="spinner" aria-hidden="true" />
          <span role="status">
            {progress
              ? `${progress.step}${
                  progress.current && progress.total
                    ? ` · ${progress.current} of ${progress.total}`
                    : ""
                }`
              : "Reading this chapter…"}
          </span>
        </div>
        <div className="guide-skeleton" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guide-scroll">
        <div className="guide-empty">
          <h3>Preview unavailable.</h3>
          <p role="alert">{error}</p>
          <Button variant="secondary" onClick={generatePreview}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="guide-scroll">
        <div className="guide-empty">
          <h3>See where this chapter is going.</h3>
          <p>
            A spoiler-free preview of {chapterLabel}: what happens, what to
            notice, and a few questions to carry while you read.
          </p>
          <Button variant="ink" onClick={generatePreview} arrow>
            Generate chapter preview
          </Button>
        </div>
      </div>
    );
  }

  const summary = summaryOf(preview);

  return (
    <div className="guide-scroll">
      <div className="guide-toolbar">
        <p className="guide-note">Spoiler-free · uses {chapterLabel} only</p>
        <button type="button" className="guide-action" onClick={refreshPreview}>
          Regenerate
        </button>
      </div>

      {summary && (
        <div className="guide-section">
          <p className="guide-label">In one paragraph</p>
          <p className="guide-p">{summary}</p>
        </div>
      )}

      {preview.themes.length > 0 && (
        <div className="guide-section">
          <p className="guide-label">Themes</p>
          <ul className="guide-list">
            {preview.themes.map((theme) => (
              <li key={theme}>{theme}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.keyConcepts.length > 0 && (
        <div className="guide-section">
          <p className="guide-label">Concepts to carry</p>
          <ul className="guide-list">
            {preview.keyConcepts.map((concept) => (
              <li key={concept}>{concept}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.toneAndStyle && (
        <div className="guide-section">
          <p className="guide-label">Tone &amp; style</p>
          <p className="guide-p">{preview.toneAndStyle}</p>
        </div>
      )}

      {preview.characters && preview.characters.length > 0 && (
        <div className="guide-section">
          <p className="guide-label">Characters to watch</p>
          <ul className="guide-list">
            {preview.characters.map((character) => (
              <li key={character}>{character}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.definitions && preview.definitions.length > 0 && (
        <div className="guide-section">
          <p className="guide-label">Terms to know</p>
          <ul className="guide-list">
            {preview.definitions.map((definition) => (
              <li key={definition.term}>
                <strong>{definition.term}.</strong> {definition.definition}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview.guidingQuestions.length > 0 && (
        <div className="guide-section">
          <p className="guide-label">Questions to hold</p>
          {preview.guidingQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="guide-q"
              onClick={() => askQuestion(question)}
            >
              {question}
              <span className="q-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

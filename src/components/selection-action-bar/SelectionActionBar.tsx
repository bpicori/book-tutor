import { useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { HighlightColor, SelectionInfo } from "../../types";
import { HIGHLIGHT_COLORS } from "../../constants";
import { getWordDefinition } from "../../services/llmService";
import { useLLMTranslationSettings } from "../../hooks/useLLMSettings";
import { useStore } from "../../store/useStore";
import { useToast } from "../ui/Toast";

interface SelectionActionBarProps {
  selection: SelectionInfo | null;
  onDismiss: () => void;
  onHighlight: (color: HighlightColor) => void;
  onAskAI: (question: string) => void;
}

interface DefinitionState {
  word: string;
  text: string | null;
  loading: boolean;
  error: string | null;
  saved: boolean;
  source: string;
}

function cleanWord(text: string): string {
  return text
    .toLowerCase()
    .replace(/^[^a-z]+|[^a-z]+$/g, "")
    .trim();
}

export function SelectionActionBar({
  selection,
  onDismiss,
  onHighlight,
  onAskAI,
}: SelectionActionBarProps) {
  const llmSettings = useLLMTranslationSettings();
  const words = useStore((state) => state.words);
  const addWord = useStore((state) => state.addWord);
  const currentBookId = useStore((state) => state.currentBookId);
  const library = useStore((state) => state.library);
  const showToast = useToast();

  const [showColors, setShowColors] = useState(false);
  const [definition, setDefinition] = useState<DefinitionState | null>(null);

  const currentBook = library.find((book) => book.id === currentBookId);
  const source = currentBook?.title ?? "This book";

  useEffect(() => {
    setShowColors(false);
    setDefinition(null);
  }, [selection?.text]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (definition) {
        setDefinition(null);
        return;
      }
      if (showColors) {
        setShowColors(false);
        return;
      }
      onDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [definition, showColors, onDismiss]);

  const handleHighlight = useCallback(
    (color: HighlightColor) => {
      onHighlight(color);
      setShowColors(false);
      showToast({ message: "Highlighted." });
    },
    [onHighlight, showToast]
  );

  const handleCopy = useCallback(() => {
    if (!selection?.text) return;
    navigator.clipboard
      .writeText(selection.text)
      .then(() => showToast({ message: "Copied to clipboard." }))
      .catch(() => showToast({ message: "Copy is blocked in this browser." }));
    onDismiss();
  }, [selection, onDismiss, showToast]);

  const handleDefine = useCallback(async () => {
    if (!selection?.text) return;
    const raw = selection.text.trim();
    const lookup = cleanWord(raw) || raw;
    const saved = words.find(
      (word) => word.word.toLowerCase() === lookup.toLowerCase()
    );

    if (saved) {
      setDefinition({
        word: saved.word,
        text: saved.definition,
        loading: false,
        error: null,
        saved: true,
        source: saved.bookTitle || source,
      });
      return;
    }

    if (!llmSettings) {
      setDefinition({
        word: lookup,
        text: null,
        loading: false,
        error: "Add an API key in Settings to define words.",
        saved: false,
        source,
      });
      return;
    }

    setDefinition({
      word: lookup,
      text: null,
      loading: true,
      error: null,
      saved: false,
      source,
    });

    try {
      const text = await getWordDefinition(raw, llmSettings);
      setDefinition((previous) =>
        previous && previous.word === lookup
          ? { ...previous, text, loading: false }
          : previous
      );
    } catch (error) {
      setDefinition((previous) =>
        previous && previous.word === lookup
          ? {
              ...previous,
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to get a definition.",
            }
          : previous
      );
    }
  }, [selection, words, llmSettings, source]);

  const handleSave = useCallback(() => {
    if (!definition?.text || definition.saved) return;
    addWord({
      id: crypto.randomUUID(),
      word: definition.word,
      definition: definition.text,
      savedAt: Date.now(),
      bookId: currentBookId || undefined,
      bookTitle: currentBook?.title,
      known: false,
    });
    setDefinition({ ...definition, saved: true });
    showToast({ message: `“${definition.word}” saved to your lexicon.` });
  }, [definition, addWord, currentBookId, currentBook, showToast]);

  const handleAsk = useCallback(() => {
    const text = selection?.text ?? "";
    onAskAI(
      `What does “${text.length > 140 ? `${text.slice(0, 140)}…` : text}” mean in this passage?`
    );
    onDismiss();
  }, [selection, onAskAI, onDismiss]);

  if (!selection) return null;

  const maxWidth = window.innerWidth - 28;
  const width = Math.min(definition ? 340 : showColors ? 250 : 320, maxWidth);
  const estimatedHeight = definition ? 230 : 44;
  const padding = 8;
  const above = selection.y >= estimatedHeight + 16;
  const left = Math.max(
    padding,
    Math.min(selection.x - width / 2, window.innerWidth - width - padding)
  );
  const top = above ? selection.y : selection.y + selection.height + 12;
  const transform = above ? "translateY(-100%)" : undefined;

  return (
    <div data-selection-bar onMouseDown={(event) => event.preventDefault()}>
      {definition ? (
        <div
          className="def-pop is-on"
          role="dialog"
          aria-label={`Definition of ${definition.word}`}
          style={{
            left,
            top,
            width,
            transform,
            maxHeight: "calc(100vh - 24px)",
            overflowY: "auto",
          }}
        >
          <button
            type="button"
            className="def-close"
            onClick={onDismiss}
            aria-label="Close definition"
          >
            ×
          </button>
          <div className="def-head">
            <h4>{definition.word}</h4>
          </div>
          {definition.loading && (
            <p className="status" role="status">
              Looking it up…
            </p>
          )}
          {definition.error && (
            <p className="status" role="alert" data-state="error">
              {definition.error}
            </p>
          )}
          {definition.text && (
            <div className="def-text">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{ p: ({ children }) => <>{children}</> }}
              >
                {definition.text}
              </Markdown>
            </div>
          )}
          <p className="def-source">{definition.source}</p>
          <div className="def-actions">
            {definition.text && !definition.saved && (
              <button type="button" onClick={handleSave}>
                Save to lexicon
              </button>
            )}
            {definition.saved && <span className="def-saved">In lexicon</span>}
            <button type="button" className="quiet" onClick={handleAsk}>
              Ask the guide
            </button>
          </div>
        </div>
      ) : (
        <div
          className="sel-bar is-on"
          role="toolbar"
          aria-label="Text actions"
          style={{ left, top, transform }}
        >
          {showColors ? (
            <div
              className="sel-colors"
              role="group"
              aria-label="Highlight color"
            >
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className="sel-color"
                  style={{ backgroundColor: color.hex }}
                  aria-label={`Highlight ${color.label}`}
                  title={color.label}
                  onClick={() => handleHighlight(color.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => setShowColors(false)}
                aria-label="Back to text actions"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => setShowColors(true)}>
                Highlight
              </button>
              <span className="sel-sep" aria-hidden="true" />
              <button type="button" onClick={() => void handleDefine()}>
                Define
              </button>
              <span className="sel-sep" aria-hidden="true" />
              <button type="button" onClick={handleAsk}>
                Ask
              </button>
              <span className="sel-sep" aria-hidden="true" />
              <button type="button" onClick={handleCopy}>
                Copy
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

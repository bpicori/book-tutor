import { useCallback, useRef, useState, useEffect } from "react";
import { getWordDefinition } from "../../services/llmService";
import { useLLMTranslationSettings } from "../../hooks/useLLMSettings";
import { ActionButton } from "./ActionButton";
import { TranslationPopup } from "./TranslationPopup";
import { useStore } from "../../store/useStore";
import { HIGHLIGHT_COLORS } from "../../constants";
import type { HighlightColor, SelectionInfo } from "../../types";

interface SelectionActionBarProps {
  selection: SelectionInfo | null;
  onDismiss: () => void;
  onHighlight: (color: HighlightColor) => void;
  onAskAI: () => void;
}

export function SelectionActionBar({
  selection,
  onDismiss,
  onHighlight,
  onAskAI,
}: SelectionActionBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showHighlightColors, setShowHighlightColors] = useState(false);
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const llmSettings = useLLMTranslationSettings();
  const { addWord, currentBookId, library } = useStore();

  const currentBook = library.find((b) => b.id === currentBookId);

  const handleCopy = useCallback(() => {
    if (selection?.text) {
      navigator.clipboard.writeText(selection.text);
      onDismiss();
    }
  }, [selection, onDismiss]);

  const handleTranslate = useCallback(async () => {
    if (!selection?.text || !llmSettings) {
      return;
    }

    const wordToTranslate = selection.text;
    currentWordRef.current = wordToTranslate;

    setShowTranslation(true);
    setShowHighlightColors(false);
    setIsLoading(true);
    setError(null);
    setDefinition(null);

    try {
      const def = await getWordDefinition(wordToTranslate, llmSettings);
      if (currentWordRef.current === wordToTranslate) {
        setDefinition(def);
      }
    } catch (err) {
      if (currentWordRef.current === wordToTranslate) {
        setError(
          err instanceof Error ? err.message : "Failed to get definition"
        );
      }
    } finally {
      if (currentWordRef.current === wordToTranslate) {
        setIsLoading(false);
      }
    }
  }, [selection, llmSettings]);

  const handleCloseTranslation = useCallback(() => {
    setShowTranslation(false);
    setDefinition(null);
    setError(null);
    setIsLoading(false);
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    currentWordRef.current = null;
    setShowTranslation(false);
    setShowHighlightColors(false);
    setDefinition(null);
    setError(null);
    setIsLoading(false);
  }, [selection?.text]);

  const handleNewWord = useCallback(async () => {
    if (!selection?.text || !llmSettings) {
      return;
    }

    const wordToSave = selection.text;
    currentWordRef.current = wordToSave;

    setShowTranslation(true);
    setShowHighlightColors(false);
    setIsLoading(true);
    setError(null);
    setDefinition(null);

    try {
      const def = await getWordDefinition(wordToSave, llmSettings);

      if (currentWordRef.current === wordToSave) {
        setDefinition(def);

        addWord({
          id: crypto.randomUUID(),
          word: wordToSave,
          definition: def,
          savedAt: Date.now(),
          bookId: currentBookId || undefined,
          bookTitle: currentBook?.title,
        });
      }
    } catch (err) {
      if (currentWordRef.current === wordToSave) {
        setError(
          err instanceof Error ? err.message : "Failed to get definition"
        );
      }
    } finally {
      if (currentWordRef.current === wordToSave) {
        setIsLoading(false);
      }
    }
  }, [selection, llmSettings, addWord, currentBookId, currentBook]);

  const handleHighlightColor = useCallback(
    (color: HighlightColor) => {
      onHighlight(color);
      setShowHighlightColors(false);
    },
    [onHighlight]
  );

  if (!selection) return null;

  const popupWidth = showTranslation ? 280 : showHighlightColors ? 220 : 260;
  const popupHeight = showTranslation ? 120 : showHighlightColors ? 48 : 44;

  const padding = 8;
  let left = selection.x - popupWidth / 2;

  const spaceAbove = selection.y;
  const spaceNeededAbove = popupHeight + padding;
  const position: "above" | "below" =
    spaceAbove >= spaceNeededAbove ? "above" : "below";

  let top: number;
  if (position === "above") {
    top = selection.y;
  } else {
    top = selection.y + selection.height + padding;
  }

  left = Math.max(
    padding,
    Math.min(left, window.innerWidth - popupWidth - padding)
  );

  if (showTranslation) {
    return (
      <TranslationPopup
        ref={barRef}
        word={selection.text}
        definition={definition}
        isLoading={isLoading}
        error={error}
        left={left}
        top={top}
        width={popupWidth}
        position={position}
        onClose={handleCloseTranslation}
      />
    );
  }

  if (showHighlightColors) {
    return (
      <div
        ref={barRef}
        className="fixed z-50 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted-gray-text shadow-lg"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          transform:
            position === "above" ? "translateY(-100%)" : "translateY(0)",
        }}
      >
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleHighlightColor(c.id)}
            className="w-7 h-7 rounded-full border-2 border-white/30 hover:scale-110 transition-transform"
            style={{ backgroundColor: c.hex }}
            title={c.label}
            aria-label={`Highlight ${c.label}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={barRef}
      className="fixed z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-muted-gray-text shadow-lg"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: position === "above" ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <ActionButton icon="content_copy" label="Copy" onClick={handleCopy} />
      <ActionButton
        icon="format_color_fill"
        label="Highlight"
        onClick={() => setShowHighlightColors(true)}
      />
      <ActionButton icon="chat" label="Ask AI" onClick={onAskAI} />
      <ActionButton
        icon="translate"
        label="Translate"
        onClick={handleTranslate}
      />
      <ActionButton
        icon="bookmark_add"
        label="New Word"
        onClick={handleNewWord}
      />
    </div>
  );
}

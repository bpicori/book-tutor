import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store/useStore";
import {
  generateChapterPreview,
  LLMServiceError,
} from "../services/llmService";
import { getBookTitle, getBookAuthor } from "../utils/bookHelpers";
import { makeChapterKey } from "../utils/chapterKeys";
import { loadChapterText } from "../utils/chapterContent";
import { useLLMSettings } from "./useLLMSettings";

export function useChapterPreview(chapterHref: string, chapterLabel: string) {
  const {
    book,
    currentBookId,
    currentSectionIndex,
    chapterPreviews,
    previewLoading,
    setChapterPreview,
    setPreviewLoading,
    clearChapterPreview,
  } = useStore(
    useShallow((state) => ({
      book: state.book,
      currentBookId: state.currentBookId,
      currentSectionIndex: state.currentSectionIndex,
      chapterPreviews: state.chapterPreviews,
      previewLoading: state.previewLoading,
      setChapterPreview: state.setChapterPreview,
      setPreviewLoading: state.setPreviewLoading,
      clearChapterPreview: state.clearChapterPreview,
    }))
  );

  const llmSettings = useLLMSettings();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    step: string;
    current?: number;
    total?: number;
  } | null>(null);

  const previewKey = makeChapterKey(currentBookId, chapterHref);
  const preview = chapterPreviews[previewKey];

  const generatePreview = useCallback(async () => {
    if (!llmSettings) {
      setError(
        "Please configure your API key in Settings to generate previews."
      );
      return;
    }

    setError(null);
    setPreviewLoading(true);

    const bookTitle = getBookTitle(book?.metadata);
    const bookAuthor = getBookAuthor(book?.metadata);

    try {
      const chapterContent = await loadChapterText(
        book,
        currentSectionIndex,
        chapterLabel
      );

      const generatedPreview = await generateChapterPreview(
        bookTitle,
        bookAuthor,
        chapterLabel,
        chapterContent,
        llmSettings,
        (step, progressInfo) => {
          setProgress({
            step,
            current: progressInfo?.current,
            total: progressInfo?.total,
          });
        }
      );

      setChapterPreview(previewKey, {
        ...generatedPreview,
        chapterHref: previewKey,
        chapterLabel,
        generatedAt: Date.now(),
      });
    } catch (err) {
      if (err instanceof LLMServiceError) {
        setError(err.message);
      } else {
        setError("Failed to generate preview. Please try again.");
      }
    } finally {
      setPreviewLoading(false);
      setProgress(null);
    }
  }, [
    book,
    previewKey,
    chapterLabel,
    currentSectionIndex,
    llmSettings,
    setChapterPreview,
    setPreviewLoading,
  ]);

  const refreshPreview = useCallback(() => {
    clearChapterPreview(previewKey);
    generatePreview();
  }, [previewKey, clearChapterPreview, generatePreview]);

  return {
    preview,
    isLoading: previewLoading,
    error,
    progress,
    generatePreview,
    refreshPreview,
  };
}

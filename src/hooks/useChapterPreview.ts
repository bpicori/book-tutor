import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store/useStore";
import {
  generateChapterPreview,
  LLMServiceError,
} from "../services/llmService";
import { getBookTitle, getBookAuthor } from "../utils/bookHelpers";
import { makeChapterKey } from "../utils/chapterKeys";
import { loadTocScopedText } from "../utils/chapterContent";
import { useLLMSettings } from "./useLLMSettings";
import { getDemoPreview, isSampleBook } from "../demo";

const DEMO_THINKING_MS = 700;

export function useChapterPreview(previewHref: string, previewLabel: string) {
  const {
    book,
    currentBookId,
    chapterPreviews,
    previewLoading,
    setChapterPreview,
    setPreviewLoading,
    clearChapterPreview,
  } = useStore(
    useShallow((state) => ({
      book: state.book,
      currentBookId: state.currentBookId,
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

  const previewKey = makeChapterKey(currentBookId, previewHref);
  const preview = chapterPreviews[previewKey];

  const generatePreview = useCallback(async () => {
    // The bundled sample book answers from pre-written fixtures: the guide can
    // be tried before a model is configured, and nothing leaves the browser.
    if (isSampleBook(currentBookId)) {
      const fixture = getDemoPreview(previewLabel, previewHref);
      if (!fixture) {
        setError(
          "The sample ships with previews for the first three chapters. Connect a model in Settings to preview every chapter, here and in any book you add."
        );
        return;
      }

      setError(null);
      setPreviewLoading(true);
      await new Promise((resolve) => setTimeout(resolve, DEMO_THINKING_MS));
      setChapterPreview(previewKey, { ...fixture, chapterHref: previewKey });
      setPreviewLoading(false);
      return;
    }

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
      const chapterContent = await loadTocScopedText(
        book,
        book?.toc,
        previewHref,
        previewLabel
      );

      const generatedPreview = await generateChapterPreview(
        bookTitle,
        bookAuthor,
        previewLabel,
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
        chapterLabel: previewLabel,
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
    currentBookId,
    previewKey,
    previewHref,
    previewLabel,
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

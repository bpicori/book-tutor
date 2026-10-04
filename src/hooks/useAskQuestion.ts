import { useCallback } from "react";
import { useStore } from "../store/useStore";

/**
 * Opens the AI panel on the Ask tab with a question already written in the
 * input box. Used by the Preview tab's guiding questions and by the reader's
 * selection and highlight actions, so they all take the same path.
 */
export function useAskQuestion(): (question: string) => void {
  const { setAiSidebarOpen, setActiveAiTab, setPendingQuote } = useStore();

  return useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      setAiSidebarOpen(true);
      setActiveAiTab("ask");
      setPendingQuote(trimmed);
    },
    [setAiSidebarOpen, setActiveAiTab, setPendingQuote]
  );
}

import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { initialReaderState } from "../store/slices/readerSlice";

// Initial state for AI sidebar reset (excludes chapterPreviews to preserve them)
const initialAISidebarStateWithoutPreviews = {
  activeAiTab: "preview" as const,
  chapterChats: {},
  previewLoading: false,
};

/**
 * Hook for navigation functions that use React Router
 */
export function useNavigation() {
  const navigate = useNavigate();

  const openBook = (bookId: string) => {
    const state = useStore.getState();
    // Update last read time
    const updatedLibrary = state.library.map((b) =>
      b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
    );
    useStore.setState({
      currentBookId: bookId,
      library: updatedLibrary,
      ...initialReaderState,
      ...initialAISidebarStateWithoutPreviews,
    });
    navigate(`/reader/${bookId}`);
  };

  const goToLibrary = () => {
    useStore.setState({
      currentBookId: null,
      ...initialReaderState,
      ...initialAISidebarStateWithoutPreviews,
    });
    navigate("/");
  };

  const goToVocabulary = () => {
    useStore.setState({
      currentBookId: null,
      ...initialReaderState,
      ...initialAISidebarStateWithoutPreviews,
    });
    navigate("/vocabulary");
  };

  const goToSettings = () => {
    navigate("/settings");
  };

  return {
    openBook,
    goToLibrary,
    goToVocabulary,
    goToSettings,
  };
}

/**
 * Hook to get current book ID from URL params
 */
export function useCurrentBookId(): string | null {
  const { bookId } = useParams<{ bookId: string }>();
  return bookId || null;
}

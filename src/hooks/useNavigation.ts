import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { initialReaderState } from "../store/slices/readerSlice";
import { navigationAISidebarReset } from "../store/slices/aiSidebarSlice";

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
      ...navigationAISidebarReset,
    });
    navigate(`/reader/${bookId}`);
  };

  const goToLibrary = () => {
    useStore.setState({
      currentBookId: null,
      ...initialReaderState,
      ...navigationAISidebarReset,
    });
    navigate("/");
  };

  const goToVocabulary = () => {
    useStore.setState({
      currentBookId: null,
      ...initialReaderState,
      ...navigationAISidebarReset,
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

import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ROUTES } from "../constants";
import { leaveReaderContext } from "../store/navigationActions";

export function useNavigation() {
  const navigate = useNavigate();

  const openBook = (bookId: string) => {
    const state = useStore.getState();
    const updatedLibrary = state.library.map((b) =>
      b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
    );
    leaveReaderContext({ bookId, library: updatedLibrary });
    navigate(ROUTES.reader(bookId));
  };

  const goToLibrary = () => {
    leaveReaderContext();
    navigate(ROUTES.library);
  };

  const goToVocabulary = () => {
    leaveReaderContext();
    navigate(ROUTES.vocabulary);
  };

  const goToSettings = () => {
    navigate(ROUTES.settings());
  };

  return {
    openBook,
    goToLibrary,
    goToVocabulary,
    goToSettings,
  };
}

export function useCurrentBookId(): string | null {
  const { bookId } = useParams<{ bookId: string }>();
  return bookId || null;
}

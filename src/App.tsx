import { useStore } from "./store/useStore";
import { LibraryPage, ReaderPage, SettingsPage, VocabularyPage } from "./pages";

export function App() {
  const { currentView } = useStore();

  const renderView = () => {
    switch (currentView) {
      case "reader":
        return <ReaderPage />;
      case "vocabulary":
        return <VocabularyPage />;
      case "library":
      default:
        return <LibraryPage />;
    }
  };

  return (
    <>
      {renderView()}
      <SettingsPage />
    </>
  );
}

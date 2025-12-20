import { useStore } from "./store/useStore";
import { LibraryPage, ReaderPage, SettingsPage, VocabularyPage } from "./pages";
import { useTheme } from "./hooks/useTheme";

export function App() {
  const { currentView } = useStore();
  useTheme();

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

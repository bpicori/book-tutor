import { Routes, Route } from "react-router-dom";
import { LibraryPage, ReaderPage, SettingsPage, VocabularyPage } from "./pages";
import { useTheme } from "./hooks/useTheme";
import { ROUTES } from "./constants";

export function App() {
  useTheme();

  return (
    <Routes>
      <Route path={ROUTES.library} element={<LibraryPage />} />
      <Route path="/reader/:bookId" element={<ReaderPage />} />
      <Route path={ROUTES.vocabulary} element={<VocabularyPage />} />
      <Route path="/settings/:tab?" element={<SettingsPage />} />
    </Routes>
  );
}

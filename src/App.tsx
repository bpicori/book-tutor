import { Routes, Route } from "react-router-dom";
import { LibraryPage, ReaderPage, SettingsPage, VocabularyPage } from "./pages";
import { useTheme } from "./hooks/useTheme";

export function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<LibraryPage />} />
      <Route path="/reader/:bookId" element={<ReaderPage />} />
      <Route path="/vocabulary" element={<VocabularyPage />} />
      <Route path="/settings/:tab?" element={<SettingsPage />} />
    </Routes>
  );
}

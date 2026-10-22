import { Navigate, Route, Routes } from "react-router-dom";
import { LibraryPage, ReaderPage, SettingsPage, VocabularyPage } from "./pages";
import { useTheme } from "./hooks/useTheme";
import { ROUTES } from "./constants";
import { AppShell } from "./components/layout/AppShell";
import { ToastProvider } from "./components/ui/Toast";

export function App() {
  useTheme();

  return (
    <ToastProvider>
      <AppShell>
        <Routes>
          <Route path={ROUTES.library} element={<LibraryPage />} />
          <Route path="/reader/:bookId" element={<ReaderPage />} />
          <Route path={ROUTES.vocabulary} element={<VocabularyPage />} />
          <Route path="/settings/:tab?" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={ROUTES.library} replace />} />
        </Routes>
      </AppShell>
    </ToastProvider>
  );
}

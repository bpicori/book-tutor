import { useStore } from './store/useStore'
import { LibraryPage, ReaderPage, SettingsPage } from './pages'

export function App() {
  const { currentView } = useStore()

  return (
    <>
      {currentView === 'reader' ? <ReaderPage /> : <LibraryPage />}
      <SettingsPage />
    </>
  )
}

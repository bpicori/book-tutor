import { useStore } from './store/useStore'
import { LibraryPage } from './components/library'
import { ReaderPage } from './components/reader'
import { SettingsModal } from './components/settings'

export function App() {
  const { currentView } = useStore()

  return (
    <>
      {currentView === 'reader' ? <ReaderPage /> : <LibraryPage />}
      <SettingsModal />
    </>
  )
}

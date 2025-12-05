import { useStore } from './store/useStore'
import { LibraryPage } from './components/library'
import { ReaderPage } from './components/reader'

export function App() {
  const { currentView } = useStore()

  return currentView === 'reader' ? <ReaderPage /> : <LibraryPage />
}

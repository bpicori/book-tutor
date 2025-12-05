import { useStore } from './store/useStore'
import { LibraryPage } from './components/LibraryPage'
import { ReaderPage } from './components/ReaderPage'

export function App() {
  const { currentView } = useStore()

  if (currentView === 'reader') {
    return <ReaderPage />
  }

  return <LibraryPage />
}

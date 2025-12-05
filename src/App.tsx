import { useStore } from './store/useStore'
import { LibraryPage } from './components/LibraryPage'
import { ReaderPage } from './components/ReaderPage'

export function App() {
  const { currentPage } = useStore()

  if (currentPage === 'reader') {
    return <ReaderPage />
  }

  return <LibraryPage />
}

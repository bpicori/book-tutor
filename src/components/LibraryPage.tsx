import { useCallback, useRef, useState } from 'react'
import { useStore, type LibraryBook } from '../store/useStore'
import { saveBookFile, deleteBookFile } from '../store/bookStorage'

// Helper to format language map objects
const formatLanguageMap = (x: unknown): string => {
  if (!x) return ''
  if (typeof x === 'string') return x
  if (typeof x === 'object' && x !== null) {
    const keys = Object.keys(x)
    return (x as Record<string, string>)[keys[0]] || ''
  }
  return ''
}

// Helper to format a single contributor
const formatOneContributor = (contributor: unknown): string => {
  if (typeof contributor === 'string') return contributor
  if (typeof contributor === 'object' && contributor !== null) {
    return formatLanguageMap((contributor as { name?: unknown }).name)
  }
  return ''
}

// Helper to format contributor(s)
const formatContributor = (contributor: unknown): string => {
  if (Array.isArray(contributor)) {
    return contributor.map(formatOneContributor).filter(Boolean).join(', ')
  }
  return formatOneContributor(contributor)
}

// Convert blob to data URL for storage
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function BookCard({ book, onOpen, onDelete }: { 
  book: LibraryBook
  onOpen: () => void
  onDelete: () => void 
}) {
  const [showMenu, setShowMenu] = useState(false)
  
  return (
    <div className="group relative flex flex-col">
      {/* Book Cover */}
      <button
        onClick={onOpen}
        className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-hover-warm shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-2 focus:ring-offset-warm-off-white"
      >
        {book.coverDataUrl ? (
          <img
            src={book.coverDataUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-green/10 to-forest-green/30">
            <span className="material-symbols-outlined text-6xl text-forest-green/50">
              menu_book
            </span>
          </div>
        )}
        
        {/* Progress indicator */}
        {book.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-forest-green transition-all"
              style={{ width: `${book.progress * 100}%` }}
            />
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
            auto_stories
          </span>
        </div>
      </button>
      
      {/* Book Info */}
      <div className="mt-3 px-1">
        <h3 className="text-muted-gray-text font-medium text-sm leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-light-gray-text text-xs mt-1 truncate">
          {book.author || 'Unknown Author'}
        </p>
      </div>
      
      {/* Menu button */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>
        
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute top-full right-0 mt-1 z-20 bg-white rounded-lg shadow-lg py-1 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AddBookCard({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  return (
    <div className="flex flex-col">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="aspect-[2/3] w-full rounded-xl border-2 border-dashed border-border-warm hover:border-forest-green bg-hover-warm/30 hover:bg-hover-warm/50 transition-all flex flex-col items-center justify-center gap-3 group"
      >
        <div className="w-16 h-16 rounded-full bg-forest-green/10 flex items-center justify-center group-hover:bg-forest-green/20 transition-colors">
          <span className="material-symbols-outlined text-3xl text-forest-green">
            add
          </span>
        </div>
        <span className="text-muted-gray-text text-sm font-medium">Add Book</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              onFileSelect(file)
              e.target.value = ''
            }
          }}
        />
      </button>
    </div>
  )
}

export function LibraryPage() {
  const { library, addBookToLibrary, removeBookFromLibrary, openBook } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true)
    
    try {
      // Create a temporary view to extract book metadata
      const view = document.createElement('foliate-view') as HTMLElement & {
        book?: {
          metadata?: { title?: unknown; author?: unknown }
          getCover?(): Promise<Blob | null>
        }
        open(file: File): Promise<void>
      }
      
      // We need to add it to the DOM temporarily for it to work
      view.style.position = 'absolute'
      view.style.left = '-9999px'
      view.style.width = '1px'
      view.style.height = '1px'
      document.body.appendChild(view)
      
      await view.open(file)
      
      const book = view.book
      const title = formatLanguageMap(book?.metadata?.title) || file.name.replace('.epub', '')
      const author = formatContributor(book?.metadata?.author) || ''
      
      // Get cover image
      let coverDataUrl: string | null = null
      if (book?.getCover) {
        try {
          const blob = await book.getCover()
          if (blob) {
            coverDataUrl = await blobToDataUrl(blob)
          }
        } catch (err) {
          console.error('Failed to load cover:', err)
        }
      }
      
      // Clean up
      view.remove()
      
      // Generate unique ID
      const id = `book-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      
      // Save file to IndexedDB
      await saveBookFile(id, file)
      
      // Add to library
      const libraryBook: LibraryBook = {
        id,
        title,
        author,
        coverDataUrl,
        addedAt: Date.now(),
        lastReadAt: null,
        progress: 0,
      }
      
      addBookToLibrary(libraryBook)
    } catch (err) {
      console.error('Failed to add book:', err)
      alert('Failed to add book. Please make sure it\'s a valid EPUB file.')
    } finally {
      setIsLoading(false)
    }
  }, [addBookToLibrary])
  
  const handleDeleteBook = useCallback(async (bookId: string) => {
    if (confirm('Are you sure you want to remove this book from your library?')) {
      await deleteBookFile(bookId)
      removeBookFromLibrary(bookId)
    }
  }, [removeBookFromLibrary])
  
  // Sort books by last read, then by added date
  const sortedLibrary = [...library].sort((a, b) => {
    if (a.lastReadAt && b.lastReadAt) return b.lastReadAt - a.lastReadAt
    if (a.lastReadAt) return -1
    if (b.lastReadAt) return 1
    return b.addedAt - a.addedAt
  })
  
  return (
    <div className="min-h-screen bg-warm-off-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-warm-off-white/95 backdrop-blur-sm border-b border-border-warm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="size-8 text-forest-green">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-muted-gray-text tracking-tight">
              Read with AI
            </h1>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-muted-gray-text mb-1">
            Your Library
          </h2>
          <p className="text-light-gray-text text-sm">
            {library.length === 0 
              ? 'Add your first book to get started' 
              : `${library.length} book${library.length === 1 ? '' : 's'}`}
          </p>
        </div>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-forest-green border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-gray-text">Adding book...</span>
            </div>
          </div>
        )}
        
        {/* Book Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <AddBookCard onFileSelect={handleFileSelect} />
          
          {sortedLibrary.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpen={() => openBook(book.id)}
              onDelete={() => handleDeleteBook(book.id)}
            />
          ))}
        </div>
        
        {/* Empty state message */}
        {library.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-6xl text-border-warm mb-4">
              library_books
            </span>
            <h3 className="text-muted-gray-text font-medium mb-2">
              Your library is empty
            </h3>
            <p className="text-light-gray-text text-sm max-w-md mx-auto">
              Click the "Add Book" card above to add your first EPUB file. 
              Your books will be saved and available even after you close the browser.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}


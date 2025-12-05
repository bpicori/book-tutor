import { memo, useState } from 'react'
import type { LibraryBook } from '../../types'
import { ProgressBar } from '../common'

interface BookCardProps {
  book: LibraryBook
  onOpen: () => void
  onDelete: () => void
}

export const BookCard = memo(function BookCard({ book, onOpen, onDelete }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="group relative flex flex-col">
      <button
        onClick={onOpen}
        className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-hover-warm shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-2 focus:ring-offset-warm-off-white"
      >
        {book.coverDataUrl ? (
          <img src={book.coverDataUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-green/10 to-forest-green/30">
            <span className="material-symbols-outlined text-6xl text-forest-green/50">menu_book</span>
          </div>
        )}

        {book.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <ProgressBar value={book.progress} height="sm" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
            auto_stories
          </span>
        </div>
      </button>

      <div className="mt-3 px-1">
        <h3 className="text-muted-gray-text font-medium text-sm leading-tight line-clamp-2">{book.title}</h3>
        <p className="text-light-gray-text text-xs mt-1 truncate">{book.author || 'Unknown Author'}</p>
      </div>

      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute top-full right-0 mt-1 z-20 bg-white rounded-lg shadow-lg py-1 min-w-[120px]">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false) }}
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
})


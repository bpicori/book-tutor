import { memo } from 'react'
import { useStore } from '../../store/useStore'
import { formatLanguageMap, formatContributor } from '../../utils/formatters'
import { TOCLink } from './TOCLink'

interface SidebarProps {
  onNavigate: (href: string) => void
}

export const Sidebar = memo(function Sidebar({ onNavigate }: SidebarProps) {
  const { book, coverUrl, isSidebarCollapsed, currentTocHref, setCurrentTocHref } = useStore()

  const title = formatLanguageMap(book?.metadata?.title) || 'Table of Contents'
  const author = formatContributor(book?.metadata?.author) || ''

  const handleNavigate = (href: string) => {
    onNavigate(href)
    setCurrentTocHref(href)
  }

  if (isSidebarCollapsed) return null

  return (
    <aside className="flex flex-col w-72 h-full bg-warm-off-white border-r border-border-warm overflow-hidden">
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="flex items-center gap-3 px-2">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-10 bg-hover-warm flex items-center justify-center flex-shrink-0"
            style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
          >
            {!coverUrl && <span className="material-symbols-outlined text-light-gray-text">menu_book</span>}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-muted-gray-text text-base font-medium leading-normal truncate">{title}</h1>
            {author && <p className="text-light-gray-text text-sm font-normal leading-normal truncate">{author}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-4 scrollbar-thin">
        <div className="flex flex-col gap-1">
          {book?.toc ? (
            book.toc.map((item, idx) => (
              <TOCLink key={idx} item={item} level={0} currentHref={currentTocHref} onNavigate={handleNavigate} />
            ))
          ) : (
            <p className="text-light-gray-text text-sm px-3 py-2">No book loaded</p>
          )}
        </div>
      </div>
    </aside>
  )
})


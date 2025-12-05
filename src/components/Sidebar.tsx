import { useStore, type TOCItem } from '../store/useStore'

interface SidebarProps {
  onNavigate: (href: string) => void
}


/**
 * TOCLink renders a Table of Contents (TOC) entry for the book sidebar navigation.
 * It displays the chapter/item label, highlights the current location, 
 * and recursively renders any subitems. Clicking on a link triggers navigation
 * and updates global state to reflect the active chapter.
 */
function TOCLink({
  item,
  level,
  onNavigate,
}: {
  item: TOCItem
  level: number
  onNavigate: (href: string) => void
}) {
  const { currentTocHref, setCurrentTocHref } = useStore()
  const isActive = currentTocHref === item.href

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onNavigate(item.href)
    setCurrentTocHref(item.href)
  }

  return (
    <>
      <a
        href="#"
        onClick={handleClick}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-active-green-light text-forest-green'
            : 'text-muted-gray-text hover:bg-hover-warm'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <span className="material-symbols-outlined text-lg">
          {level > 0 ? 'subdirectory_arrow_right' : 'description'}
        </span>
        <p className="text-sm font-medium leading-normal truncate">{item.label}</p>
      </a>
      {item.subitems?.map((subitem, idx) => (
        <TOCLink key={idx} item={subitem} level={level + 1} onNavigate={onNavigate} />
      ))}
    </>
  )
}

// Helper to format language map objects (like title)
const formatLanguageMap = (x: unknown): string => {
  if (!x) return ''
  if (typeof x === 'string') return x
  if (typeof x === 'object' && x !== null) {
    const keys = Object.keys(x)
    return (x as Record<string, string>)[keys[0]] || ''
  }
  return ''
}

// Helper to format a single contributor (can be string or object with name property)
const formatOneContributor = (contributor: unknown): string => {
  if (typeof contributor === 'string') return contributor
  if (typeof contributor === 'object' && contributor !== null) {
    return formatLanguageMap((contributor as { name?: unknown }).name)
  }
  return ''
}

// Helper to format contributor(s) - handles both single and array
const formatContributor = (contributor: unknown): string => {
  if (Array.isArray(contributor)) {
    return contributor.map(formatOneContributor).filter(Boolean).join(', ')
  }
  return formatOneContributor(contributor)
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { book, coverUrl, isSidebarCollapsed } = useStore()

  const title = formatLanguageMap(book?.metadata?.title) || 'Table of Contents'
  const author = formatContributor(book?.metadata?.author) || ''

  if (isSidebarCollapsed) {
    return null
  }

  return (
    <aside className="flex flex-col w-72 h-full bg-warm-off-white border-r border-border-warm overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="flex flex-col gap-4">
          {/* Book Info Header */}
          <div className="flex items-center gap-3 px-2">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-10 bg-hover-warm flex items-center justify-center flex-shrink-0"
              style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
            >
              {!coverUrl && (
                <span className="material-symbols-outlined text-light-gray-text">menu_book</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-muted-gray-text text-base font-medium leading-normal truncate">{title}</h1>
              {author && (
                <p className="text-light-gray-text text-sm font-normal leading-normal truncate">{author}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable TOC List */}
      <div className="flex-1 overflow-y-auto p-4 pt-4 scrollbar-thin">
        <div className="flex flex-col gap-1">
          {book?.toc ? (
            book.toc.map((item, idx) => (
              <TOCLink key={idx} item={item} level={0} onNavigate={onNavigate} />
            ))
          ) : (
            <p className="text-light-gray-text text-sm px-3 py-2">No book loaded</p>
          )}
        </div>
      </div>
    </aside>
  )
}


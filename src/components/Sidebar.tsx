import { useStore, type TOCItem } from '../store/useStore'

interface SidebarProps {
  onNavigate: (href: string) => void
  onFileSelect: (file: File) => void
}

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

export function Sidebar({ onNavigate, onFileSelect }: SidebarProps) {
  const { book, coverUrl } = useStore()

  const title = formatLanguageMap(book?.metadata?.title) || 'Open a Book'
  const author = formatContributor(book?.metadata?.author) || 'Select an EPUB file'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <aside className="flex flex-col w-72 bg-warm-off-white border-r border-border-warm">
      <div className="flex flex-col h-full justify-between p-4">
        <div className="flex flex-col gap-4">
          {/* Book Info Header */}
          <div className="flex items-center gap-3 px-2">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-10 bg-hover-warm flex items-center justify-center"
              style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
            >
              {!coverUrl && (
                <span className="material-symbols-outlined text-light-gray-text">menu_book</span>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-muted-gray-text text-base font-medium leading-normal">{title}</h1>
              <p className="text-light-gray-text text-sm font-normal leading-normal">{author}</p>
            </div>
          </div>

          {/* File Input */}
          <div className="px-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-forest-green text-white cursor-pointer hover:bg-forest-green/90 transition-colors">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              <span className="text-sm font-medium">Open EPUB</span>
              <input
                type="file"
                accept=".epub"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* TOC List */}
          <div className="flex flex-col gap-1 mt-2 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin">
            {book?.toc ? (
              book.toc.map((item, idx) => (
                <TOCLink key={idx} item={item} level={0} onNavigate={onNavigate} />
              ))
            ) : (
              <p className="text-light-gray-text text-sm px-3 py-2">No book loaded</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}


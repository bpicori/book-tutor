import { useStore } from '../store/useStore'

interface HeaderProps {
  onPrev: () => void
  onNext: () => void
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

export function Header({ onPrev, onNext }: HeaderProps) {
  const { book, toggleAiSidebar, toggleSidebar, isSidebarCollapsed } = useStore()
  const title = formatLanguageMap(book?.metadata?.title) || 'Read with AI'

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-warm px-8 py-3 bg-sepia-panel">
      <div className="flex items-center gap-4 text-muted-gray-text">
        <button
          onClick={() => toggleSidebar()}
          className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-hover-warm text-muted-gray-text hover:bg-hover-warm/70 text-sm font-bold transition-colors"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-xl">
            {isSidebarCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
        <div className="size-4 text-forest-green">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className="text-muted-gray-text text-lg font-bold leading-tight tracking-[-0.015em]">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-hover-warm text-muted-gray-text hover:bg-hover-warm/70 text-sm font-bold transition-colors"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-xl">chevron_left</span>
        </button>
        <button
          onClick={onNext}
          className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-hover-warm text-muted-gray-text hover:bg-hover-warm/70 text-sm font-bold transition-colors"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-xl">chevron_right</span>
        </button>
        <button
          onClick={() => toggleAiSidebar()}
          className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-hover-warm text-muted-gray-text hover:bg-hover-warm/70 text-sm font-bold transition-colors"
          aria-label="Toggle AI Assistant"
        >
          <span className="material-symbols-outlined text-xl">smart_toy</span>
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      </div>
    </header>
  )
}


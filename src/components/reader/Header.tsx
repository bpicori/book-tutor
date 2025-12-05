import { memo } from 'react'
import { useStore } from '../../store/useStore'
import { formatLanguageMap } from '../../utils/formatters'
import { IconButton, Logo } from '../common'

interface HeaderProps {
  onPrev: () => void
  onNext: () => void
}

export const Header = memo(function Header({ onPrev, onNext }: HeaderProps) {
  const { book, toggleAiSidebar, toggleSidebar, isSidebarCollapsed, goToLibrary } = useStore()
  const title = formatLanguageMap(book?.metadata?.title) || 'Read with AI'

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-warm px-8 py-3 bg-sepia-panel">
      <div className="flex items-center gap-4 text-muted-gray-text">
        <IconButton
          icon={isSidebarCollapsed ? 'menu' : 'menu_open'}
          label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => toggleSidebar()}
        />
        <IconButton icon="arrow_back" label="Back to Library" text="Library" onClick={goToLibrary} />
        <Logo size="sm" />
        <h2 className="text-muted-gray-text text-lg font-bold leading-tight tracking-[-0.015em]">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <IconButton icon="chevron_left" label="Previous page" onClick={onPrev} />
        <IconButton icon="chevron_right" label="Next page" onClick={onNext} />
        <IconButton icon="smart_toy" label="Toggle AI Assistant" text="AI Assistant" onClick={() => toggleAiSidebar()} />
      </div>
    </header>
  )
})


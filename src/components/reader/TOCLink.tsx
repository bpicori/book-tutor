import { memo } from 'react'
import type { TOCItem } from '../../types'

interface TOCLinkProps {
  item: TOCItem
  level: number
  currentHref: string | null
  onNavigate: (href: string) => void
}

export const TOCLink = memo(function TOCLink({ item, level, currentHref, onNavigate }: TOCLinkProps) {
  const isActive = currentHref === item.href

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onNavigate(item.href)
  }

  return (
    <>
      <a
        href="#"
        onClick={handleClick}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive ? 'bg-active-green-light text-forest-green' : 'text-muted-gray-text hover:bg-hover-warm'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <span className="material-symbols-outlined text-lg">
          {level > 0 ? 'subdirectory_arrow_right' : 'description'}
        </span>
        <p className="text-sm font-medium leading-normal truncate">{item.label}</p>
      </a>
      {item.subitems?.map((subitem, idx) => (
        <TOCLink key={idx} item={subitem} level={level + 1} currentHref={currentHref} onNavigate={onNavigate} />
      ))}
    </>
  )
})


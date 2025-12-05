import { memo } from 'react'
import { useStore } from '../../store/useStore'
import { ProgressBar } from '../common'

export const Footer = memo(function Footer() {
  const { book, progress } = useStore()
  const percent = Math.round(progress.fraction * 100)

  if (!book) return null

  return (
    <footer className="p-6 border-t border-border-warm bg-sepia-panel">
      <div className="flex flex-col gap-2">
        <div className="flex gap-6 justify-between items-center">
          <p className="text-muted-gray-text text-sm font-medium leading-normal">
            {progress.tocLabel || 'Reading Progress'}
          </p>
          <p className="text-light-gray-text text-sm">{percent}%</p>
        </div>
        <ProgressBar value={progress.fraction} />
      </div>
    </footer>
  )
})


import { memo } from 'react'

interface ProgressBarProps {
  value: number // 0-1
  height?: 'sm' | 'md'
}

export const ProgressBar = memo(function ProgressBar({ value, height = 'md' }: ProgressBarProps) {
  const heightClass = height === 'sm' ? 'h-1' : 'h-2'
  
  return (
    <div className={`w-full rounded-full bg-hover-warm ${heightClass}`}>
      <div
        className={`${heightClass} rounded-full bg-forest-green transition-all duration-300`}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  )
})


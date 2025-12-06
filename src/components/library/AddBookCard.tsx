import { memo, useRef } from "react"

interface AddBookCardProps {
  onFileSelect: (file: File) => void
}

export const AddBookCard = memo(function AddBookCard({
  onFileSelect,
}: AddBookCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      e.target.value = ""
    }
  }

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
        <span className="text-muted-gray-text text-sm font-medium">
          Add Book
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          className="hidden"
          onChange={handleChange}
        />
      </button>
    </div>
  )
})

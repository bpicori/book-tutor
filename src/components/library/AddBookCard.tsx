import { memo, useRef, useState, useCallback } from "react";

interface AddBookCardProps {
  onFileSelect: (file: File) => void;
  variant?: "grid" | "hero";
}

export const AddBookCard = memo(function AddBookCard({
  onFileSelect,
  variant = "grid",
}: AddBookCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (file && file.name.toLowerCase().endsWith(".epub")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const isHero = variant === "hero";

  return (
    <div className={`flex flex-col ${isHero ? "w-full max-w-sm mx-auto" : ""}`}>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full rounded-xl border-2 border-dashed transition-all
          flex flex-col items-center justify-center group
          focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2 focus-visible:ring-offset-warm-off-white
          ${
            isDragging
              ? "border-forest-green bg-forest-green/10 scale-[1.01]"
              : "border-border-warm hover:border-forest-green bg-hover-warm/30 hover:bg-hover-warm/50"
          }
          ${
            isHero
              ? "aspect-[2/3] gap-4 shadow-sm hover:shadow-md"
              : "aspect-[2/3] gap-3"
          }
        `
          .trim()
          .replace(/\s+/g, " ")}
      >
        <div
          className={`rounded-full bg-forest-green/10 flex items-center justify-center group-hover:bg-forest-green/20 transition-colors ${
            isHero ? "w-20 h-20" : "w-16 h-16"
          }`}
        >
          <span
            className={`material-symbols-outlined text-forest-green ${
              isHero ? "text-4xl" : "text-3xl"
            }`}
          >
            add
          </span>
        </div>
        <div className="text-center px-4">
          <span
            className={`block text-muted-gray-text font-medium ${
              isHero ? "text-base" : "text-sm"
            }`}
          >
            {isHero ? "Add your first book" : "Add Book"}
          </span>
          {isHero && (
            <span className="block text-light-gray-text text-sm mt-1">
              Click or drop an EPUB file
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          className="hidden"
          onChange={handleChange}
        />
      </button>
    </div>
  );
});
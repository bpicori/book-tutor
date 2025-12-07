import { memo } from "react";

interface IconButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  text?: string;
  variant?: "default" | "circle";
}

export const IconButton = memo(function IconButton({
  icon,
  label,
  onClick,
  text,
  variant = "default",
}: IconButtonProps) {
  const baseClasses =
    "flex cursor-pointer items-center justify-center overflow-hidden bg-hover-warm text-muted-gray-text hover:bg-hover-warm/70 transition-colors";

  const variantClasses =
    variant === "circle"
      ? "rounded-full h-10 w-10"
      : `rounded-lg h-10 ${text ? "gap-2 px-3" : "w-10"}`;

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses}`}
      aria-label={label}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      {text && (
        <span className="hidden sm:inline text-sm font-medium">{text}</span>
      )}
    </button>
  );
});

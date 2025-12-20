import { memo } from "react";

interface IconButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  text?: string;
  variant?: "default" | "circle" | "flat";
}

export const IconButton = memo(function IconButton({
  icon,
  label,
  onClick,
  text,
  variant = "default",
}: IconButtonProps) {
  const baseClasses = `
    flex cursor-pointer items-center justify-center overflow-hidden
    transition-all duration-300 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-green/40 focus-visible:ring-offset-2
  `.trim().replace(/\s+/g, ' ');

  const variantStyles = {
    default: `
      rounded-xl h-10 ${text ? "gap-2.5 px-4" : "w-10"}
      bg-hover-warm/60 backdrop-blur-sm
      text-muted-gray-text
      border border-border-warm/60
      shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4)]
      hover:bg-hover-warm/80
      hover:text-forest-green
      hover:border-forest-green/25
      hover:shadow-[0_3px_10px_rgba(0,0,0,0.06),0_0_0_1px_rgba(34,87,50,0.08)]
      hover:-translate-y-0.5
      active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]
    `.trim().replace(/\s+/g, ' '),

    circle: `
      rounded-full h-10 w-10
      bg-hover-warm/60 backdrop-blur-sm
      text-muted-gray-text
      border border-border-warm/60
      shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.4)]
      hover:bg-hover-warm/80
      hover:text-forest-green
      hover:border-forest-green/25
      hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(34,87,50,0.1)]
      hover:scale-105
      active:scale-100 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]
    `.trim().replace(/\s+/g, ' '),

    flat: `
      rounded-lg h-9 ${text ? "gap-2 px-3" : "w-9"}
      bg-transparent
      text-light-gray-text
      hover:bg-hover-warm/50
      hover:text-forest-green
      active:bg-hover-warm/70
    `.trim().replace(/\s+/g, ' '),
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantStyles[variant]}`}
      aria-label={label}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      {text && (
        <span className="hidden sm:inline text-sm font-medium tracking-wide">{text}</span>
      )}
    </button>
  );
});

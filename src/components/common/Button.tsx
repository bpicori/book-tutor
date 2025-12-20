import { memo, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon" | "pill";
  icon?: string;
  children?: React.ReactNode;
}

export const Button = memo(function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 
    font-medium tracking-wide
    transition-all duration-300 ease-out
    focus-visible:outline-none
    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
  `
    .trim()
    .replace(/\s+/g, " ");

  const variantClasses = {
    // Primary: Elegant filled button with glow effect
    primary: `
      px-5 py-2.5 
      bg-gradient-to-b from-forest-green to-forest-green/90
      text-white text-sm
      rounded-xl
      border border-forest-green/20
      shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(34,87,50,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
      hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_24px_rgba(34,87,50,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]
      hover:from-forest-green/95 hover:to-forest-green/85
      hover:-translate-y-px
      active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.1)]
      focus-visible:ring-2 focus-visible:ring-forest-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-off-white
    `
      .trim()
      .replace(/\s+/g, " "),

    // Secondary: Frosted glass with subtle border
    secondary: `
      px-5 py-2.5
      bg-warm-off-white/60 backdrop-blur-sm
      text-muted-gray-text text-sm
      rounded-xl
      border border-border-warm/80
      shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.5)]
      hover:bg-hover-warm/70
      hover:border-forest-green/30
      hover:text-forest-green
      hover:shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_0_1px_rgba(34,87,50,0.1),inset_0_1px_0_rgba(255,255,255,0.6)]
      hover:-translate-y-px
      active:translate-y-0 active:bg-hover-warm/90 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]
      focus-visible:ring-2 focus-visible:ring-forest-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-off-white
    `
      .trim()
      .replace(/\s+/g, " "),

    // Ghost: Minimal, text-only with elegant hover
    ghost: `
      px-3 py-1.5
      text-muted-gray-text text-sm
      rounded-lg
      bg-transparent
      hover:bg-hover-warm/50
      hover:text-forest-green
      active:bg-hover-warm/70
      focus-visible:ring-2 focus-visible:ring-forest-green/30 focus-visible:ring-offset-1
    `
      .trim()
      .replace(/\s+/g, " "),

    // Icon: Square/circular icon button with depth
    icon: `
      w-10 h-10
      text-light-gray-text
      rounded-xl
      bg-warm-off-white/40 backdrop-blur-sm
      border border-border-warm/50
      shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4)]
      hover:bg-hover-warm/60
      hover:text-forest-green
      hover:border-forest-green/25
      hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(34,87,50,0.08)]
      hover:-translate-y-0.5
      active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]
      focus-visible:ring-2 focus-visible:ring-forest-green/40 focus-visible:ring-offset-1
    `
      .trim()
      .replace(/\s+/g, " "),

    // Pill: Rounded pill for tags/actions
    pill: `
      px-4 py-1.5
      text-sm text-forest-green
      rounded-full
      bg-forest-green/5
      border border-forest-green/20
      shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]
      hover:bg-forest-green/10
      hover:border-forest-green/35
      hover:shadow-[0_2px_6px_rgba(34,87,50,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]
      active:bg-forest-green/15
      focus-visible:ring-2 focus-visible:ring-forest-green/30 focus-visible:ring-offset-1
    `
      .trim()
      .replace(/\s+/g, " "),
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {icon && (
        <span className="material-symbols-outlined text-[1.125rem] leading-none">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
});

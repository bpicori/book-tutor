import { memo, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon";
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
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variantClasses = {
    primary:
      "px-4 py-2.5 bg-forest-green text-white rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
    secondary:
      "px-4 py-2.5 bg-transparent text-muted-gray-text border border-border-warm rounded-lg hover:bg-hover-warm hover:border-forest-green/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
    ghost:
      "px-3 py-1.5 text-muted-gray-text rounded-lg hover:bg-hover-warm/70 active:bg-hover-warm",
    icon: "w-9 h-9 rounded-lg text-light-gray-text hover:text-forest-green hover:bg-hover-warm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {icon && (
        <span className="material-symbols-outlined text-lg leading-none">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
});


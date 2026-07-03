import type { ReactNode } from "react";

type BannerVariant = "info" | "success" | "error" | "warning";

const variantClasses: Record<BannerVariant, string> = {
  info: "bg-paper-dark/50 border-border-warm text-muted-gray-text",
  success: "bg-green-500/10 border-green-500/20 text-green-800",
  error: "bg-red-500/10 border-red-500/20 text-red-800",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-800",
};

interface StatusBannerProps {
  variant: BannerVariant;
  children: ReactNode;
  className?: string;
}

export function StatusBanner({
  variant,
  children,
  className = "",
}: StatusBannerProps) {
  return (
    <div
      className={`p-3 border rounded-lg text-sm ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

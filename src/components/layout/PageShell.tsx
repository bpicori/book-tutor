import type { ReactNode } from "react";
import { Brand, IconButton, Logo } from "../common";

interface PageShellProps {
  variant: "home" | "subpage";
  title?: string;
  onBack?: () => void;
  backText?: string;
  actions?: ReactNode;
  children: ReactNode;
  mainClassName?: string;
}

export function PageShell({
  variant,
  title,
  onBack,
  backText = "Back",
  actions,
  children,
  mainClassName = "flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 flex flex-col",
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-warm-off-white flex flex-col">
      <header className="sticky top-0 z-10 bg-warm-off-white/95 backdrop-blur-sm border-b border-border-warm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between gap-3">
            {variant === "home" ? (
              <h1 className="min-w-0">
                <Brand />
              </h1>
            ) : (
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                {onBack && (
                  <IconButton
                    icon="arrow_back"
                    label="Back"
                    text={backText}
                    onClick={onBack}
                  />
                )}
                <Logo size="sm" />
                {title && (
                  <h1 className="text-lg md:text-xl font-bold text-muted-gray-text tracking-tight truncate">
                    {title}
                  </h1>
                )}
              </div>
            )}
            {actions && (
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className={mainClassName}>{children}</main>
    </div>
  );
}

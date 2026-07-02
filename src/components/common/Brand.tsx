import { memo } from "react";
import { APP_NAME } from "../../constants";
import { Logo } from "./Logo";

interface BrandProps {
  size?: "sm" | "md";
  showWordmark?: boolean;
}

export const Brand = memo(function Brand({
  size = "md",
  showWordmark = true,
}: BrandProps) {
  const containerClass =
    size === "sm" ? "rounded-lg p-1" : "rounded-xl p-1.5 md:p-2";
  const textClass = size === "sm" ? "text-base" : "text-xl md:text-2xl";
  const gapClass = size === "sm" ? "gap-2" : "gap-2.5 md:gap-3";

  return (
    <div className={`flex items-center ${gapClass} min-w-0`}>
      <div
        className={`flex items-center justify-center bg-forest-green/10 ${containerClass}`}
      >
        <Logo size={size} />
      </div>
      {showWordmark && (
        <div
          className={`flex items-baseline gap-1 ${textClass} min-w-0 leading-none`}
          aria-label={APP_NAME}
        >
          <span
            className="font-semibold text-muted-gray-text tracking-tight"
            style={{ fontFamily: "var(--font-family-serif-main)" }}
          >
            Book
          </span>
          <span className="font-bold text-forest-green tracking-tight">
            Tutor
          </span>
        </div>
      )}
    </div>
  );
});

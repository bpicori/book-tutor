import { memo } from "react";

interface LogoProps {
  size?: "sm" | "md";
}

const LOGO_SRC = `${import.meta.env.BASE_URL}icons/logo-192.png`;

export const Logo = memo(function Logo({ size = "md" }: LogoProps) {
  const sizeClass = size === "sm" ? "size-5" : "size-10 md:size-12";
  const pixelSize = size === "sm" ? 20 : 48;

  return (
    <img
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={pixelSize}
      height={pixelSize}
      className={`${sizeClass} shrink-0 select-none`}
    />
  );
});

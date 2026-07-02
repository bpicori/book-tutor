import { memo } from "react";

interface LogoProps {
  size?: "sm" | "md";
}

export const Logo = memo(function Logo({ size = "md" }: LogoProps) {
  const sizeClass = size === "sm" ? "size-4" : "size-8";

  return (
    <div className={`${sizeClass} shrink-0 text-forest-green`}>
      <svg
        aria-hidden="true"
        fill="none"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M34 4C34.6 6.8 36.7 8.9 39.5 9.5C36.7 10.1 34.6 12.2 34 15C33.4 12.2 31.3 10.1 28.5 9.5C31.3 8.9 33.4 6.8 34 4Z"
          fill="currentColor"
          opacity="0.85"
        />
        <path
          d="M5 18C5 15.5 10 13 23 15.25V37.5C14.5 38.5 7.5 37.5 5 34.5V18Z"
          fill="currentColor"
        />
        <path
          d="M25 15.25C38 13 43 15.5 43 18V34.5C40.5 37.5 33.5 38.5 25 37.5V15.25Z"
          fill="currentColor"
          opacity="0.72"
        />
        <path
          d="M23 15.25C23.8 15.1 24.2 15.1 25 15.25V37.5C24.2 37.35 23.8 37.35 23 37.5V15.25Z"
          fill="currentColor"
          opacity="0.35"
        />
        <path
          d="M10 21.5C13.5 20.5 17.5 20.75 21 21.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />
        <path
          d="M27 21.75C30.5 20.75 34.5 20.5 38 21.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
});

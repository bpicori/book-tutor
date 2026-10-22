import { memo, type ReactNode, type SVGProps } from "react";

export type IconName =
  | "spark"
  | "monogram"
  | "brandBook"
  | "library"
  | "lexicon"
  | "settings"
  | "search"
  | "arrowRight"
  | "arrowLeft"
  | "close"
  | "contents"
  | "bookmark"
  | "headphones"
  | "play"
  | "pause"
  | "prev"
  | "next"
  | "plus"
  | "upload"
  | "download"
  | "trash"
  | "refresh"
  | "check"
  | "chevronDown"
  | "chevronRight";

const ICONS: Record<IconName, ReactNode> = {
  spark: (
    <path d="M12 2.5c.6 5.2 4.3 8.9 9.5 9.5-5.2.6-8.9 4.3-9.5 9.5C11.4 16.3 7.7 12.6 2.5 12 7.7 11.4 11.4 7.7 12 2.5Z" />
  ),
  monogram: (
    <>
      <path
        fillRule="evenodd"
        d="M3.7 3.6h3v5.8c1.2-.9 2.6-1.3 4.1-1.3 3.3 0 5.6 2.4 5.6 5.8s-2.3 5.8-5.6 5.8c-1.5 0-2.9-.4-4.1-1.3v1.3h-3V3.6ZM9.4 14.1a2.6 2.6 0 1 1 5.2 0 2.6 2.6 0 1 1-5.2 0Z"
        fill="currentColor"
        stroke="none"
      />
      <circle
        cx="19"
        cy="19.6"
        r="1.35"
        fill="var(--page-accent)"
        stroke="none"
      />
    </>
  ),
  brandBook: (
    <>
      <path
        d="M2.9 6.4c2.9-.8 5.9-.5 8.5 1.1v11.7c-2.6-1.6-5.6-1.9-8.5-1.1V6.4Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M21.1 6.4c-2.9-.8-5.9-.5-8.5 1.1v11.7c2.6-1.6 5.6-1.9 8.5-1.1V6.4Z"
        fill="var(--page-accent)"
        stroke="none"
      />
    </>
  ),
  library: (
    <>
      <path d="M4 19V5.5A1.5 1.5 0 0 1 5.5 4H9v15H4Z" />
      <path d="M9 19V4h5.5A1.5 1.5 0 0 1 16 5.5V19H9Z" />
      <path d="m16 7 3.2-.7a1.2 1.2 0 0 1 1.5 1v11.2l-4.7 1V7Z" />
    </>
  ),
  lexicon: (
    <>
      <path d="M5 18 9.4 6h1.2L15 18" />
      <path d="M6.8 13.8h6" />
      <path d="M17 11v7" />
      <path d="M17 11c1.8 0 3 1 3 2.6S18.8 16 17 16" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  arrowRight: <path d="M5 12h13M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H6M11 6l-6 6 6 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  contents: <path d="M4 7h16M4 12h11M4 17h16" />,
  bookmark: (
    <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1Z" />
  ),
  headphones: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 14h2.5v5H5a1 1 0 0 1-1-1v-4Zm16 0h-2.5v5H19a1 1 0 0 0 1-1v-4Z" />
    </>
  ),
  play: <path d="M8 5v14l11-7L8 5Z" fill="currentColor" stroke="none" />,
  pause: (
    <g fill="currentColor" stroke="none">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </g>
  ),
  prev: (
    <g fill="currentColor" stroke="none">
      <path d="M7 5v14H4V5h3Z" />
      <path d="M20 5v14L9 12 20 5Z" />
    </g>
  ),
  next: (
    <g fill="currentColor" stroke="none">
      <path d="M17 5v14h3V5h-3Z" />
      <path d="M4 5v14l11-7L4 5Z" />
    </g>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  upload: (
    <>
      <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 6.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export const Icon = memo(function Icon({
  name,
  size = 18,
  strokeWidth = 1.5,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {ICONS[name]}
    </svg>
  );
});

import type { ReactNode } from "react";

interface ChipProps {
  active?: boolean;
  count?: number;
  children: ReactNode;
  onClick: () => void;
}

export function Chip({ active = false, count, children, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`chip${active ? " is-on" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
      {typeof count === "number" && <span className="count">{count}</span>}
    </button>
  );
}

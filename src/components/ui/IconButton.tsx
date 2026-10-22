import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName;
  label: string;
  /** Visible label for the desktop tool buttons. */
  text?: string;
  variant?: "tool" | "close" | "plain";
  active?: boolean;
}

export function IconButton({
  icon,
  label,
  text,
  variant = "tool",
  active = false,
  className = "",
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  const base =
    variant === "tool"
      ? `tool${active ? " is-on" : ""}`
      : variant === "close"
        ? "icon-close"
        : "";

  return (
    <button
      type={type}
      className={`${base}${className ? ` ${className}` : ""}`.trim()}
      aria-label={label}
      title={text ?? label}
      aria-pressed={active || undefined}
      {...props}
    >
      {variant === "close" ? (
        <Icon name="close" size={18} />
      ) : (
        icon && <Icon name={icon} size={15} />
      )}
      {text && <span className="lbl">{text}</span>}
      {children}
    </button>
  );
}

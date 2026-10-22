import type { ReactNode } from "react";

export function Page({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`page${className ? ` ${className}` : ""}`}>{children}</div>
  );
}

interface PageHeaderProps {
  eyebrow: ReactNode;
  title: string;
  lead?: ReactNode;
}

export function PageHeader({ eyebrow, title, lead }: PageHeaderProps) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display">{title}</h1>
      </div>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}

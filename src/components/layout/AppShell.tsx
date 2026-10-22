import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Rail } from "./Rail";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation();
  const isReader = pathname.startsWith("/reader/");

  useEffect(() => {
    document.body.classList.toggle("is-reading", isReader);
    return () => document.body.classList.remove("is-reading");
  }, [isReader]);

  return (
    <div className="app">
      <Rail />
      <div
        key={pathname}
        className={`screen is-active${isReader ? " reader-screen" : ""}`}
        role="main"
      >
        {children}
      </div>
    </div>
  );
}

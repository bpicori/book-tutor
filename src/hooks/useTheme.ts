import { useEffect } from "react";
import { useStore } from "../store/useStore";

/**
 * Hook that applies the selected theme to the document root element
 * by setting the data-theme attribute. This allows CSS to switch themes
 * via CSS custom property overrides.
 */
export function useTheme() {
  const theme = useStore((state) => state.settings.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "sepia") {
      // Sepia is the default, remove data-theme attribute
      root.removeAttribute("data-theme");
    } else {
      // Apply theme via data-theme attribute
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);
}

import type { Theme } from "../types";

export interface ThemePaletteEntry {
  id: Theme;
  label: string;
  description: string;
  reader: {
    /** CSS color used inside the EPUB iframe and the reader chrome. */
    bg: string;
    /** CSS color for body text. */
    text: string;
    colorScheme: "light" | "dark";
  };
}

export const THEME_PALETTE: Record<Theme, ThemePaletteEntry> = {
  paper: {
    id: "paper",
    label: "Paper",
    description: "Default",
    reader: {
      bg: "oklch(100% 0.002 95)",
      text: "oklch(20% 0.018 70)",
      colorScheme: "light",
    },
  },
  sepia: {
    id: "sepia",
    label: "Sepia",
    description: "Warm",
    reader: {
      bg: "oklch(96% 0.032 84)",
      text: "oklch(29% 0.022 65)",
      colorScheme: "light",
    },
  },
  solarized: {
    id: "solarized",
    label: "Solarized",
    description: "Low glare",
    reader: {
      bg: "oklch(95% 0.024 90)",
      text: "oklch(37% 0.028 205)",
      colorScheme: "light",
    },
  },
  night: {
    id: "night",
    label: "Night",
    description: "Low light",
    reader: {
      bg: "oklch(22% 0.005 250)",
      text: "oklch(90% 0.006 250)",
      colorScheme: "dark",
    },
  },
};

export const THEMES = Object.values(THEME_PALETTE).map(
  ({ id, label, description }) => ({ id, label, description })
);

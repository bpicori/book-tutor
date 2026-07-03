import type { Theme } from "../types";

export interface ThemePaletteEntry {
  id: Theme;
  label: string;
  description: string;
  reader: { bg: string; text: string; colorScheme: "light" | "dark" };
  ui: {
    bg: string;
    panel: string;
    primary: string;
    text: string;
    border: string;
  };
}

export const THEME_PALETTE: Record<Theme, ThemePaletteEntry> = {
  sepia: {
    id: "sepia",
    label: "Sepia",
    description: "Warm, book-like reading experience",
    reader: { bg: "#fdf0d0", text: "#544d45", colorScheme: "light" },
    ui: {
      bg: "#f7f3eb",
      panel: "#fdf0d0",
      primary: "#225732",
      text: "#544d45",
      border: "#e8e0ce",
    },
  },
  solarized: {
    id: "solarized",
    label: "Solarized Light",
    description: "Eye-friendly light theme with teal accents",
    reader: { bg: "#eee8d5", text: "#657b83", colorScheme: "light" },
    ui: {
      bg: "#fdf6e3",
      panel: "#eee8d5",
      primary: "#268bd2",
      text: "#657b83",
      border: "#93a1a1",
    },
  },
  nord: {
    id: "nord",
    label: "Nord",
    description: "Cool arctic blue-gray palette",
    reader: { bg: "#3b4252", text: "#d8dee9", colorScheme: "dark" },
    ui: {
      bg: "#2e3440",
      panel: "#3b4252",
      primary: "#88c0d0",
      text: "#d8dee9",
      border: "#4c566a",
    },
  },
  dark: {
    id: "dark",
    label: "Dark",
    description: "Deep dark theme for low-light reading",
    reader: { bg: "#242424", text: "#e5e5e5", colorScheme: "dark" },
    ui: {
      bg: "#1a1a1a",
      panel: "#242424",
      primary: "#7dd3fc",
      text: "#e5e5e5",
      border: "#404040",
    },
  },
};

export const THEMES = Object.values(THEME_PALETTE).map(
  ({ id, label, description }) => ({ id, label, description })
);

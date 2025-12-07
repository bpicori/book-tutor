import type { StateCreator } from "zustand";
import type { ReaderSettings } from "../../types";
import { DEFAULT_SETTINGS } from "../../constants";

export interface UISlice {
  // State
  isAiSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isSettingsOpen: boolean;
  settings: ReaderSettings;

  // Actions
  toggleAiSidebar: (open?: boolean) => void;
  toggleSidebar: (collapsed?: boolean) => void;
  toggleSettings: (open?: boolean) => void;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  resetSettings: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Initial state
  isAiSidebarOpen: true,
  isSidebarCollapsed: false,
  isSettingsOpen: false,
  settings: DEFAULT_SETTINGS,

  // Actions
  toggleAiSidebar: (open) =>
    set((state) => ({
      isAiSidebarOpen: open ?? !state.isAiSidebarOpen,
    })),

  toggleSidebar: (collapsed) =>
    set((state) => ({
      isSidebarCollapsed: collapsed ?? !state.isSidebarCollapsed,
    })),

  toggleSettings: (open) =>
    set((state) => ({
      isSettingsOpen: open ?? !state.isSettingsOpen,
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
});

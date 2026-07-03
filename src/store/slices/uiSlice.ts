import type { StateCreator } from "zustand";
import type { ReaderSettings } from "../../types";
import { DEFAULT_SETTINGS } from "../../constants";

export interface UISlice {
  isAiSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  settings: ReaderSettings;

  setAiSidebarOpen: (open?: boolean) => void;
  setSidebarCollapsed: (collapsed?: boolean) => void;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  resetSettings: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isAiSidebarOpen: true,
  isSidebarCollapsed: false,
  settings: DEFAULT_SETTINGS,

  setAiSidebarOpen: (open) =>
    set((state) => ({
      isAiSidebarOpen: open ?? !state.isAiSidebarOpen,
    })),

  setSidebarCollapsed: (collapsed) =>
    set((state) => ({
      isSidebarCollapsed: collapsed ?? !state.isSidebarCollapsed,
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
});

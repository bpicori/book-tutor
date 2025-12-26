import type { StateCreator } from "zustand";

export interface CloudSyncConfig {
  apiUrl: string;
  username: string;
  password: string;
}

export interface CloudSyncState {
  enabled: boolean;
  config: CloudSyncConfig;
  lastSyncAt: number | null;
  lastSyncStatus: "success" | "error" | null;
  lastSyncMessage: string | null;
}

export interface CloudSyncSlice {
  // State
  cloudSync: CloudSyncState;

  // Actions
  setCloudSyncEnabled: (enabled: boolean) => void;
  updateCloudSyncConfig: (config: Partial<CloudSyncConfig>) => void;
  setLastSync: (
    timestamp: number | null,
    status: "success" | "error" | null,
    message: string | null
  ) => void;
  resetCloudSync: () => void;
}

const defaultConfig: CloudSyncConfig = {
  apiUrl: "",
  username: "",
  password: "",
};

const initialState: CloudSyncState = {
  enabled: false,
  config: defaultConfig,
  lastSyncAt: null,
  lastSyncStatus: null,
  lastSyncMessage: null,
};

export const createCloudSyncSlice: StateCreator<CloudSyncSlice> = (set) => ({
  // Initial state
  cloudSync: initialState,

  // Actions
  setCloudSyncEnabled: (enabled) =>
    set((state) => ({
      cloudSync: { ...state.cloudSync, enabled },
    })),

  updateCloudSyncConfig: (newConfig) =>
    set((state) => ({
      cloudSync: {
        ...state.cloudSync,
        config: { ...state.cloudSync.config, ...newConfig },
      },
    })),

  setLastSync: (timestamp, status, message) =>
    set((state) => ({
      cloudSync: {
        ...state.cloudSync,
        lastSyncAt: timestamp,
        lastSyncStatus: status,
        lastSyncMessage: message,
      },
    })),

  resetCloudSync: () =>
    set({
      cloudSync: initialState,
    }),
});


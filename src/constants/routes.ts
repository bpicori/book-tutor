export const ROUTES = {
  library: "/",
  reader: (bookId: string) => `/reader/${bookId}`,
  vocabulary: "/vocabulary",
  settings: (tab?: string) => (tab ? `/settings/${tab}` : "/settings"),
} as const;

export const SETTINGS_TABS = [
  { id: "typography", label: "Typography", icon: "text_fields" },
  { id: "theme", label: "Theme", icon: "palette" },
  { id: "llm", label: "LLM", icon: "smart_toy" },
  { id: "backup", label: "Backup", icon: "download" },
  { id: "cloudsync", label: "Cloud Sync", icon: "cloud_sync" },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

export function isValidSettingsTabId(
  tab: string | undefined
): tab is SettingsTabId {
  return (
    tab !== undefined &&
    SETTINGS_TABS.some((settingsTab) => settingsTab.id === tab)
  );
}

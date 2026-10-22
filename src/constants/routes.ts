export const ROUTES = {
  library: "/",
  reader: (bookId: string) => `/reader/${bookId}`,
  vocabulary: "/vocabulary",
  settings: (tab?: string) => (tab ? `/settings/${tab}` : "/settings"),
} as const;

export const SETTINGS_TABS = [
  { id: "typography", label: "Typography", index: "01" },
  { id: "appearance", label: "Appearance", index: "02" },
  { id: "guide", label: "The guide", index: "03" },
  { id: "voice", label: "Voice", index: "04" },
  { id: "data", label: "Data", index: "05" },
  { id: "cloud", label: "Cloud", index: "06" },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

/** Old routes kept working for bookmarks and in-app links. */
export const SETTINGS_TAB_ALIASES: Record<string, SettingsTabId> = {
  theme: "appearance",
  llm: "guide",
  speech: "voice",
  backup: "data",
  cloudsync: "cloud",
};

export function isValidSettingsTabId(
  tab: string | undefined
): tab is SettingsTabId {
  return (
    tab !== undefined &&
    SETTINGS_TABS.some((settingsTab) => settingsTab.id === tab)
  );
}

export function resolveSettingsTab(tab: string | undefined): SettingsTabId {
  if (isValidSettingsTabId(tab)) return tab;
  if (tab && SETTINGS_TAB_ALIASES[tab]) return SETTINGS_TAB_ALIASES[tab];
  return "typography";
}

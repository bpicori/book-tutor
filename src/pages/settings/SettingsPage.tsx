import { memo, useState, useEffect } from "react";
import type { ComponentType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../../store/useStore";
import {
  ROUTES,
  SETTINGS_TABS,
  isValidSettingsTabId,
  type SettingsTabId,
} from "../../constants";
import { PageShell } from "../../components/layout/PageShell";
import {
  TypographyTab,
  LLMTab,
  BackupTab,
  ThemeTab,
  CloudSyncTab,
} from "../../components/settings";
import type { ReaderSettings } from "../../types";

interface SettingsTabProps {
  settings: ReaderSettings;
  onUpdate: (settings: Partial<ReaderSettings>) => void;
}

const SETTINGS_TAB_COMPONENTS: Record<
  "typography" | "theme" | "llm",
  ComponentType<SettingsTabProps>
> = {
  typography: TypographyTab,
  theme: ThemeTab,
  llm: LLMTab,
};

export const SettingsPage = memo(function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
    return isValidSettingsTabId(tab) ? tab : "typography";
  });

  useEffect(() => {
    if (isValidSettingsTabId(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab, activeTab]);

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    navigate(ROUTES.settings(tabId), { replace: true });
  };

  const tabContent =
    activeTab === "backup" ? (
      <BackupTab />
    ) : activeTab === "cloudsync" ? (
      <CloudSyncTab />
    ) : (
      (() => {
        const ActiveTabComponent = SETTINGS_TAB_COMPONENTS[activeTab];
        return (
          <ActiveTabComponent settings={settings} onUpdate={updateSettings} />
        );
      })()
    );

  return (
    <PageShell
      variant="subpage"
      title="Settings"
      onBack={() => navigate(-1)}
      mainClassName="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-6 md:py-8"
    >
      <div className="flex gap-1 mb-6 flex-shrink-0 border-b border-border-warm/50 pb-px overflow-x-auto scrollbar-thin scrollbar-thumb-border-warm">
        {SETTINGS_TABS.map((settingsTab) => (
          <button
            key={settingsTab.id}
            onClick={() => handleTabChange(settingsTab.id)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 rounded-t-lg min-w-[44px] md:min-w-0 min-h-[44px] md:min-h-0 flex-shrink-0 transition-all duration-300 ease-out border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-green/40 focus-visible:ring-offset-1 ${
              activeTab === settingsTab.id
                ? "border-forest-green text-forest-green bg-warm-off-white/80 shadow-[0_-2px_8px_rgba(34,87,50,0.08)]"
                : "border-transparent text-light-gray-text hover:text-muted-gray-text hover:bg-hover-warm/30"
            }`}
            title={settingsTab.label}
          >
            <span className="material-symbols-outlined text-xl">
              {settingsTab.icon}
            </span>
            <span className="hidden sm:inline text-sm font-medium tracking-wide whitespace-nowrap">
              {settingsTab.label}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-y-auto">{tabContent}</div>
    </PageShell>
  );
});

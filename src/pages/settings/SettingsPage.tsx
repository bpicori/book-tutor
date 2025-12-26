import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { IconButton, Logo } from "../../components/common";
import {
  TypographyTab,
  LLMTab,
  BackupTab,
  ThemeTab,
  CloudSyncTab,
} from "../../components/settings";

type TabId = "typography" | "theme" | "llm" | "backup" | "cloudsync";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: "typography", label: "Typography", icon: "text_fields" },
  { id: "theme", label: "Theme", icon: "palette" },
  { id: "llm", label: "LLM", icon: "smart_toy" },
  { id: "backup", label: "Backup", icon: "download" },
  { id: "cloudsync", label: "Cloud Sync", icon: "cloud_sync" },
];

export const SettingsPage = memo(function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("typography");

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "typography":
        return <TypographyTab settings={settings} onUpdate={updateSettings} />;
      case "theme":
        return <ThemeTab settings={settings} onUpdate={updateSettings} />;
      case "llm":
        return <LLMTab settings={settings} onUpdate={updateSettings} />;
      case "backup":
        return <BackupTab />;
      case "cloudsync":
        return <CloudSyncTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-warm-off-white flex flex-col">
      <header className="sticky top-0 z-10 bg-warm-off-white/95 backdrop-blur-sm border-b border-border-warm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <IconButton
                icon="arrow_back"
                label="Back"
                text="Back"
                onClick={handleBack}
              />
              <Logo size="sm" />
              <h1 className="text-lg md:text-xl font-bold text-muted-gray-text tracking-tight truncate">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 flex-shrink-0 border-b border-border-warm/50 pb-px overflow-x-auto scrollbar-thin scrollbar-thumb-border-warm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 rounded-t-lg min-w-[44px] md:min-w-0 min-h-[44px] md:min-h-0 flex-shrink-0
                transition-all duration-300 ease-out
                border-b-2 -mb-px
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-green/40 focus-visible:ring-offset-1
                ${
                  activeTab === tab.id
                    ? "border-forest-green text-forest-green bg-warm-off-white/80 shadow-[0_-2px_8px_rgba(34,87,50,0.08)]"
                    : "border-transparent text-light-gray-text hover:text-muted-gray-text hover:bg-hover-warm/30"
                }
              `
                .trim()
                .replace(/\s+/g, " ")}
              title={tab.label}
            >
              <span className="material-symbols-outlined text-xl md:text-xl">
                {tab.icon}
              </span>
              <span className="hidden sm:inline text-sm font-medium tracking-wide whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto">{renderTabContent()}</div>
      </main>
    </div>
  );
});

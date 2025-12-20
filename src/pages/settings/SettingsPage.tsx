import { memo, useState } from "react";
import { useStore } from "../../store/useStore";
import { Modal } from "../../components/common";
import { TypographyTab, LLMTab, BackupTab, ThemeTab } from "../../components/settings";

type TabId = "typography" | "theme" | "llm" | "backup";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: "typography", label: "Typography", icon: "text_fields" },
  { id: "theme", label: "Theme", icon: "palette" },
  { id: "llm", label: "LLM", icon: "smart_toy" },
  { id: "backup", label: "Backup", icon: "cloud_sync" },
];

export const SettingsPage = memo(function SettingsPage() {
  const { isSettingsOpen, toggleSettings, settings, updateSettings } =
    useStore();
  const [activeTab, setActiveTab] = useState<TabId>("typography");

  const handleClose = () => {
    toggleSettings(false);
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
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isSettingsOpen} onClose={handleClose} title="Settings">
      <div className="flex flex-col h-full px-6 py-4">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4 -mx-6 px-6 flex-shrink-0 border-b border-border-warm/50 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-t-lg
                transition-all duration-300 ease-out
                border-b-2 -mb-px
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-green/40 focus-visible:ring-offset-1
                ${
                  activeTab === tab.id
                    ? "border-forest-green text-forest-green bg-warm-off-white/80 shadow-[0_-2px_8px_rgba(34,87,50,0.08)]"
                    : "border-transparent text-light-gray-text hover:text-muted-gray-text hover:bg-hover-warm/30"
                }
              `.trim().replace(/\s+/g, ' ')}
            >
              <span className="material-symbols-outlined text-xl">
                {tab.icon}
              </span>
              <span className="text-sm font-medium tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
});

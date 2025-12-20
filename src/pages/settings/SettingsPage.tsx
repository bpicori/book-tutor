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
        <div className="flex border-b border-border-warm mb-4 -mx-6 px-6 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ease-out ${
                activeTab === tab.id
                  ? "border-forest-green text-forest-green shadow-sm"
                  : "border-transparent text-light-gray-text hover:text-muted-gray-text hover:border-border-warm"
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {tab.icon}
              </span>
              <span className="text-sm font-medium">{tab.label}</span>
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

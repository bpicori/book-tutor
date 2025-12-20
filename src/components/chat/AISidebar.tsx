import { memo, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { PreviewTab } from "./PreviewTab";
import { AskTab } from "./AskTab";
import type { AiSidebarTab } from "../../types";

const TAB_CONFIG: {
  id: AiSidebarTab;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "preview",
    label: "Preview",
    icon: "visibility",
    description: "Orient before reading",
  },
  { id: "ask", label: "Ask", icon: "chat", description: "Q&A after reading" },
];

export const AISidebar = memo(function AISidebar() {
  const { isAiSidebarOpen, toggleAiSidebar, activeAiTab, setActiveAiTab } =
    useStore();

  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    if (isAiSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isAiSidebarOpen]);

  if (!isAiSidebarOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        onClick={() => toggleAiSidebar(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="flex flex-col w-96 max-w-[85vw] h-full bg-warm-off-white border-l border-border-warm overflow-hidden fixed md:relative right-0 top-0 z-50 md:z-auto transform transition-transform md:translate-x-0">
        {/* Header */}
        <header className="flex-shrink-0 p-4 border-b border-border-warm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-muted-gray-text font-semibold text-base">
              AI Reading Guide
            </h3>
            <button
              onClick={() => toggleAiSidebar(false)}
              className="w-11 h-11 md:w-10 md:h-10 min-w-[44px] md:min-w-0 min-h-[44px] md:min-h-0 flex items-center justify-center rounded-lg hover:bg-hover-warm text-light-gray-text hover:text-forest-green transition-colors"
              aria-label="Close AI sidebar"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-hover-warm rounded-lg p-1">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAiTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  activeAiTab === tab.id
                    ? "bg-white text-forest-green shadow-sm"
                    : "text-light-gray-text hover:text-muted-gray-text"
                }`}
                title={tab.description}
              >
                <span className="material-symbols-outlined text-lg">
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeAiTab === "preview" ? <PreviewTab /> : <AskTab />}
        </div>
      </aside>
    </>
  );
});

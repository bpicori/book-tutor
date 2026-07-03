import { memo } from "react";
import { useStore } from "../../store/useStore";
import { PreviewTab } from "./PreviewTab";
import { AskTab } from "./AskTab";
import { SegmentedTabs } from "../common/SegmentedTabs";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import type { AiSidebarTab } from "../../types";

const TAB_CONFIG: { id: AiSidebarTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "ask", label: "Ask" },
];

export const AISidebar = memo(function AISidebar() {
  const { isAiSidebarOpen, setAiSidebarOpen, activeAiTab, setActiveAiTab } =
    useStore();

  useBodyScrollLock(isAiSidebarOpen && window.innerWidth < 768);

  if (!isAiSidebarOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        onClick={() => setAiSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className="flex flex-col w-[32rem] max-w-[85vw] h-full bg-warm-off-white border-l border-border-warm overflow-hidden fixed md:relative right-0 top-0 z-50 md:z-auto transform transition-transform md:translate-x-0">
        <header className="flex-shrink-0 p-4 border-b border-border-warm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-muted-gray-text font-semibold text-base">
              AI Reading Guide
            </h3>
            <button
              onClick={() => setAiSidebarOpen(false)}
              className="w-11 h-11 md:w-10 md:h-10 min-w-[44px] md:min-w-0 min-h-[44px] md:min-h-0 flex items-center justify-center rounded-lg hover:bg-hover-warm text-light-gray-text hover:text-forest-green transition-colors"
              aria-label="Close AI sidebar"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <SegmentedTabs
            tabs={TAB_CONFIG}
            activeId={activeAiTab}
            onChange={(id) => setActiveAiTab(id as AiSidebarTab)}
          />
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeAiTab === "preview" ? <PreviewTab /> : <AskTab />}
        </div>
      </aside>
    </>
  );
});

import { memo } from "react"
import { useStore } from "../../store/useStore"
import { PreviewTab } from "./PreviewTab"
import { AskTab } from "./AskTab"
import type { AiSidebarTab } from "../../types"

const TAB_CONFIG: {
  id: AiSidebarTab
  label: string
  icon: string
  description: string
}[] = [
  {
    id: "preview",
    label: "Preview",
    icon: "visibility",
    description: "Orient before reading",
  },
  { id: "ask", label: "Ask", icon: "chat", description: "Q&A after reading" },
]

export const AISidebar = memo(function AISidebar() {
  const { isAiSidebarOpen, toggleAiSidebar, activeAiTab, setActiveAiTab } =
    useStore()

  if (!isAiSidebarOpen) return null

  return (
    <aside className="flex flex-col w-96 h-full bg-warm-off-white border-l border-border-warm overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-border-warm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-muted-gray-text font-semibold text-base">
            AI Reading Guide
          </h3>
          <button
            onClick={() => toggleAiSidebar(false)}
            className="text-light-gray-text hover:text-forest-green transition-colors"
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
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeAiTab === "preview" ? <PreviewTab /> : <AskTab />}
      </div>
    </aside>
  )
})

interface SegmentedTab {
  id: string;
  label: string;
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentedTabs({
  tabs,
  activeId,
  onChange,
  className = "",
}: SegmentedTabsProps) {
  return (
    <div className={`flex rounded-lg bg-hover-warm/50 p-1 ${className}`.trim()}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeId === tab.id
              ? "bg-sepia-panel text-forest-green shadow-sm"
              : "text-light-gray-text hover:text-muted-gray-text"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

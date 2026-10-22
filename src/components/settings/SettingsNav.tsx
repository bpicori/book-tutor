import { SETTINGS_TABS, type SettingsTabId } from "../../constants";

interface SettingsNavProps {
  active: SettingsTabId;
  onSelect: (tab: SettingsTabId) => void;
}

export function SettingsNav({ active, onSelect }: SettingsNavProps) {
  return (
    <nav className="settings-nav" aria-label="Settings sections">
      {SETTINGS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`set-nav-item${active === tab.id ? " is-active" : ""}`}
          aria-current={active === tab.id ? "page" : undefined}
          onClick={() => onSelect(tab.id)}
        >
          <span className="idx">{tab.index}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

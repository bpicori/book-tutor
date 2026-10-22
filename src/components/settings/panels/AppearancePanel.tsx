import { THEMES } from "../../../constants";
import { useStore } from "../../../store/useStore";
import { Switch } from "../../ui/Switch";

export function AppearancePanel() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

  return (
    <>
      <div className="set-head">
        <h2>Appearance</h2>
        <p>
          Four papers. One for daylight, one for lamplight. The choice follows
          you into the reader.
        </p>
      </div>

      <div className="theme-grid" role="group" aria-label="Reading theme">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-card${settings.theme === theme.id ? " is-on" : ""}`}
            aria-pressed={settings.theme === theme.id}
            onClick={() => updateSettings({ theme: theme.id })}
          >
            <span className="theme-swatch" data-swatch={theme.id}>
              <span className="ts-aa">Aa</span>
              <span className="ts-lines">
                <i />
                <i />
                <i />
              </span>
            </span>
            <span className="theme-name">
              {theme.label}
              <small>{theme.description}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="setting-list">
        <div className="toggle-row">
          <div>
            <p className="toggle-title">Show progress while reading</p>
            <p className="toggle-sub">
              A two-pixel line at the top of the page, filled to your place in
              the book.
            </p>
          </div>
          <Switch
            checked={settings.showProgress}
            onChange={(showProgress) => updateSettings({ showProgress })}
            label="Show reading progress"
          />
        </div>

        <div className="toggle-row">
          <div>
            <p className="toggle-title">Reduce motion</p>
            <p className="toggle-sub">
              Stop panel slides and page transitions. The layout stays the same.
            </p>
          </div>
          <Switch
            checked={settings.reduceMotion}
            onChange={(reduceMotion) => updateSettings({ reduceMotion })}
            label="Reduce motion"
          />
        </div>
      </div>
    </>
  );
}

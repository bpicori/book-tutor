import {
  DEFAULT_SETTINGS,
  READER_FONT_OPTIONS,
  READER_LINE_HEIGHTS,
  READER_WIDTHS,
  THEMES,
} from "../../constants";
import { useStore } from "../../store/useStore";
import { Range } from "../ui/Field";
import { Segmented } from "../ui/Segmented";

const LEADING_OPTIONS = [
  { value: READER_LINE_HEIGHTS[0], label: "Tight" },
  { value: READER_LINE_HEIGHTS[1], label: "Standard" },
  { value: READER_LINE_HEIGHTS[2], label: "Airy" },
];

const WIDTH_OPTIONS = [
  { value: READER_WIDTHS[0], label: "Narrow" },
  { value: READER_WIDTHS[1], label: "Standard" },
  { value: READER_WIDTHS[2], label: "Wide" },
];

export function TypePopover() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

  const fontLabel =
    READER_FONT_OPTIONS.find((font) => font.value === settings.fontFamily)
      ?.label ?? "Iowan";

  const resetReading = () => {
    updateSettings({
      fontFamily: DEFAULT_SETTINGS.fontFamily,
      fontSize: DEFAULT_SETTINGS.fontSize,
      lineHeight: DEFAULT_SETTINGS.lineHeight,
      readingWidth: DEFAULT_SETTINGS.readingWidth,
      theme: DEFAULT_SETTINGS.theme,
    });
  };

  return (
    <div className="type-pop is-open" id="type-pop" aria-hidden="false">
      <div className="tp-head">
        <h3>Reading</h3>
        <button type="button" className="tp-reset" onClick={resetReading}>
          Reset
        </button>
      </div>

      <div className="tp-group">
        <p className="tp-label">
          <span>Typeface</span>
          <b>{fontLabel}</b>
        </p>
        <Segmented
          options={READER_FONT_OPTIONS}
          value={settings.fontFamily}
          onChange={(fontFamily) => updateSettings({ fontFamily })}
          label="Reading typeface"
        />
      </div>

      <div className="tp-group">
        <p className="tp-label">
          <span>Size</span>
          <b>{settings.fontSize.toFixed(1)} px</b>
        </p>
        <Range
          value={settings.fontSize}
          min={16}
          max={24}
          step={0.5}
          label="Reading font size"
          onChange={(fontSize) => updateSettings({ fontSize })}
        />
      </div>

      <div className="tp-group">
        <p className="tp-label">
          <span>Leading</span>
        </p>
        <Segmented
          options={LEADING_OPTIONS}
          value={settings.lineHeight}
          onChange={(lineHeight) => updateSettings({ lineHeight })}
          label="Reading leading"
        />
      </div>

      <div className="tp-group">
        <p className="tp-label">
          <span>Paper</span>
        </p>
        <div className="tp-themes">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`theme-dot${settings.theme === theme.id ? " is-on" : ""}`}
              data-theme-val={theme.id}
              aria-label={`${theme.label} theme`}
              aria-pressed={settings.theme === theme.id}
              onClick={() => updateSettings({ theme: theme.id })}
            >
              Aa
            </button>
          ))}
        </div>
      </div>

      <div className="tp-group">
        <p className="tp-label">
          <span>Measure</span>
        </p>
        <Segmented
          options={WIDTH_OPTIONS}
          value={settings.readingWidth}
          onChange={(readingWidth) => updateSettings({ readingWidth })}
          label="Reading measure"
        />
      </div>
    </div>
  );
}

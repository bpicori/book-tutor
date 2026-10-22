import {
  READER_FONT_OPTIONS,
  READER_LINE_HEIGHTS,
  READER_WIDTHS,
} from "../../../constants";
import { useStore } from "../../../store/useStore";
import { Range } from "../../ui/Field";
import { Segmented } from "../../ui/Segmented";

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

export function TypographyPanel() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

  const fontLabel =
    READER_FONT_OPTIONS.find((font) => font.value === settings.fontFamily)
      ?.label ?? "Iowan";

  return (
    <>
      <div className="set-head">
        <h2>Typography</h2>
        <p>
          Choose a face, a size, and a measure. The preview uses the page you
          are reading.
        </p>
      </div>

      <div className="set-grid">
        <div className="set-controls">
          <div className="control">
            <div className="control-label">
              <span>Typeface</span>
              <b>{fontLabel}</b>
            </div>
            <Segmented
              options={READER_FONT_OPTIONS}
              value={settings.fontFamily}
              onChange={(fontFamily) => updateSettings({ fontFamily })}
              label="Typeface"
            />
          </div>

          <div className="control">
            <div className="control-label">
              <span>Size</span>
              <b>{settings.fontSize.toFixed(1)} px</b>
            </div>
            <Range
              id="set-size"
              value={settings.fontSize}
              min={16}
              max={24}
              step={0.5}
              label="Reading font size"
              onChange={(fontSize) => updateSettings({ fontSize })}
            />
            <div className="range-scale">
              <span>16</span>
              <span>24</span>
            </div>
          </div>

          <div className="control">
            <div className="control-label">
              <span>Leading</span>
            </div>
            <Segmented
              options={LEADING_OPTIONS}
              value={settings.lineHeight}
              onChange={(lineHeight) => updateSettings({ lineHeight })}
              label="Reading leading"
            />
          </div>

          <div className="control">
            <div className="control-label">
              <span>Measure</span>
            </div>
            <Segmented
              options={WIDTH_OPTIONS}
              value={settings.readingWidth}
              onChange={(readingWidth) => updateSettings({ readingWidth })}
              label="Reading measure"
            />
          </div>

          <p className="note">
            Changes save automatically and follow you into the reader.
          </p>
        </div>

        <div className="specimen" aria-label="Typography preview">
          <div className="sp-head">
            <span>Preview</span>
            <span>Chapter Three</span>
          </div>
          <p className="sp-first">
            <span className="sp-drop">T</span>here was music from my neighbor’s
            house through the summer nights. In his blue gardens men and girls
            came and went like moths among the whisperings and the champagne and
            the stars.
          </p>
          <p className="sp-next">
            At high tide in the afternoon I watched his guests diving from the
            tower of his raft, or taking the sun on the hot sand of his beach.
          </p>
        </div>
      </div>
    </>
  );
}

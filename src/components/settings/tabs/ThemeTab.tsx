import { memo } from "react";
import type { ReaderSettings, Theme } from "../../../types";
import { THEMES } from "../../../constants";

interface ThemeTabProps {
  settings: ReaderSettings;
  onUpdate: (settings: Partial<ReaderSettings>) => void;
}

// Theme color previews for visual selection
const themeColors: Record<Theme, { bg: string; panel: string; primary: string; text: string; border: string }> = {
  sepia: {
    bg: "#f7f3eb",
    panel: "#fdf0d0",
    primary: "#225732",
    text: "#544d45",
    border: "#e8e0ce",
  },
  solarized: {
    bg: "#fdf6e3",
    panel: "#eee8d5",
    primary: "#268bd2",
    text: "#657b83",
    border: "#93a1a1",
  },
  nord: {
    bg: "#2e3440",
    panel: "#3b4252",
    primary: "#88c0d0",
    text: "#d8dee9",
    border: "#4c566a",
  },
  dark: {
    bg: "#1a1a1a",
    panel: "#242424",
    primary: "#7dd3fc",
    text: "#e5e5e5",
    border: "#404040",
  },
};

export const ThemeTab = memo(function ThemeTab({
  settings,
  onUpdate,
}: ThemeTabProps) {
  const handleThemeChange = (theme: Theme) => {
    onUpdate({ theme });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-muted-gray-text mb-4">
          Choose Theme
        </label>
        <div className="grid grid-cols-2 gap-4">
          {THEMES.map((themeInfo) => {
            const colors = themeColors[themeInfo.id];
            const isSelected = settings.theme === themeInfo.id;

            return (
              <button
                key={themeInfo.id}
                onClick={() => handleThemeChange(themeInfo.id)}
                className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-forest-green ring-2 ring-forest-green ring-offset-2 ring-offset-warm-off-white"
                    : "border-border-warm hover:border-hover-warm"
                }`}
                style={{
                  backgroundColor: colors.panel,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                {/* Theme preview colors */}
                <div className="flex gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: colors.bg }}
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: colors.panel }}
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded border"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    }}
                  />
                </div>

                {/* Theme info */}
                <div>
                  <div
                    className="font-semibold text-sm mb-1"
                    style={{ color: colors.text }}
                  >
                    {themeInfo.label}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: colors.text, opacity: 0.7 }}
                  >
                    {themeInfo.description}
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <span className="material-symbols-outlined text-xs text-white">
                      check
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});


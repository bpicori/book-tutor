import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { READER_FONTS } from "../constants";

/**
 * Applies the reading preferences to the document.
 *
 * The paper theme only changes the reader/page tokens; the app chrome keeps
 * the paper interface. `data-reading-theme` is global so the settings
 * specimen and the reader share the same palette.
 */
export function useTheme() {
  const settings = useStore((state) => state.settings);

  useEffect(() => {
    const body = document.body;
    const root = document.documentElement.style;

    body.dataset.readingTheme = settings.theme;
    root.setProperty("--reading-size", `${settings.fontSize}px`);
    root.setProperty("--reading-leading", String(settings.lineHeight));
    root.setProperty("--reading-width", `${settings.readingWidth}px`);
    root.setProperty(
      "--reading-font",
      READER_FONTS[settings.fontFamily] ?? READER_FONTS.iowan
    );

    body.classList.toggle("hide-progress", !settings.showProgress);
    body.classList.toggle("reduce-motion", settings.reduceMotion);
  }, [
    settings.theme,
    settings.fontSize,
    settings.lineHeight,
    settings.readingWidth,
    settings.fontFamily,
    settings.showProgress,
    settings.reduceMotion,
  ]);
}

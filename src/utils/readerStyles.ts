import type { ReaderSettings, Theme } from "../types";

/**
 * Theme color mappings for reader content
 */
const themeColors: Record<
  Theme,
  { bg: string; text: string; colorScheme: "light" | "dark" }
> = {
  sepia: {
    bg: "#fdf0d0",
    text: "#544d45",
    colorScheme: "light",
  },
  solarized: {
    bg: "#eee8d5",
    text: "#657b83",
    colorScheme: "light",
  },
  nord: {
    bg: "#3b4252",
    text: "#d8dee9",
    colorScheme: "dark",
  },
  dark: {
    bg: "#242424",
    text: "#e5e5e5",
    colorScheme: "dark",
  },
};

/**
 * Generates CSS styles for the foliate-view reader with typography and theme settings
 */
export function generateReaderCSS(settings: ReaderSettings): string {
  const { fontFamily, fontSize, lineHeight, theme } = settings;
  const colors = themeColors[theme];

  return `
    @namespace epub "http://www.idpf.org/2007/ops";
    html {
        color-scheme: ${colors.colorScheme};
        background-color: ${colors.bg} !important;
    }
    body {
        font-family: "${fontFamily}", serif;
        font-size: ${fontSize}px;
        background-color: ${colors.bg} !important;
        color: ${colors.text} !important;
    }
    /* Override book-specific colors for all text elements */
    p, li, blockquote, dd, div, span, h1, h2, h3, h4, h5, h6, td, th, pre, code {
        color: ${colors.text} !important;
    }
    /* Override background colors */
    p, li, blockquote, dd, div, section, article, td, th {
        background-color: transparent !important;
    }
    /* Ensure body background applies to all sections */
    body > section, body > article, body > div {
        background-color: ${colors.bg} !important;
    }
    p, li, blockquote, dd {
        font-family: "${fontFamily}", serif;
        font-size: ${fontSize}px;
        line-height: ${lineHeight};
        text-align: start;
        -webkit-hyphens: manual;
        hyphens: manual;
        -webkit-hyphenate-limit-before: 3;
        -webkit-hyphenate-limit-after: 2;
        -webkit-hyphenate-limit-lines: 2;
        hanging-punctuation: allow-end last;
        widows: 2;
    }
    /* Override link colors to be theme-appropriate */
    a, a:link, a:visited, a:hover, a:active {
        color: ${colors.text} !important;
        opacity: 0.8;
    }
    a:hover {
        opacity: 1;
    }
    
    /* prevent the above from overriding the align attribute */
    [align="left"] { text-align: left; }
    [align="right"] { text-align: right; }
    [align="center"] { text-align: center; }
    [align="justify"] { text-align: justify; }

    pre {
        white-space: pre-wrap !important;
        color: ${colors.text} !important;
        background-color: transparent !important;
    }
    aside[epub|type~="endnote"],
    aside[epub|type~="footnote"],
    aside[epub|type~="note"],
    aside[epub|type~="rearnote"] {
        display: none;
    }
  `;
}

import type { ReaderSettings } from "../types"

/**
 * Generates CSS styles for the foliate-view reader with typography settings
 */
export function generateReaderCSS(settings: ReaderSettings): string {
  const { fontFamily, fontSize, lineHeight } = settings

  return `
    @namespace epub "http://www.idpf.org/2007/ops";
    html {
        color-scheme: light;
        background-color: #FDF0D0;
    }
    body {
        font-family: "${fontFamily}", serif;
        font-size: ${fontSize}px;
        background-color: #FDF0D0;
        color: #544D45;
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
    /* prevent the above from overriding the align attribute */
    [align="left"] { text-align: left; }
    [align="right"] { text-align: right; }
    [align="center"] { text-align: center; }
    [align="justify"] { text-align: justify; }

    pre {
        white-space: pre-wrap !important;
    }
    aside[epub|type~="endnote"],
    aside[epub|type~="footnote"],
    aside[epub|type~="note"],
    aside[epub|type~="rearnote"] {
        display: none;
    }
  `
}

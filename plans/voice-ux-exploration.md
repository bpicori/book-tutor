# Read-Aloud (Voice v1) — UX & Plan Proposal

> Status: design proposal for review. No implementation yet.
> Decisions locked from discussion: **read-along only**, **in-app playback**,
> **cloud voice via a new, separate speech provider**, **player in the
> footer**, **paragraph or chapter start**, **paragraph-level highlight**,
> **no speed control in v1**, **player owns navigation while playing**,
> **stop at chapter end**, **Chrome desktop is the primary target**.

## Context

Book Tutor is a browser EPUB reader with an AI sidekick. The goal is to let a
reader start listening at any paragraph or chapter and follow the spoken text
while they read. It is a reading aid, not an audiobook: no screen-off/background
playback, no MediaSession, no sleep timer in v1. Speech comes from a new,
separate speech provider (OpenAI-compatible `/audio/speech`, OpenRouter
first-class), so it bills the speech provider per character and needs its own
key, model, and voice.

What the codebase already gives us:

- foliate-js re-emits a `load` event per rendered section with the iframe
  document (`src/foliate-js/view.js`), so paragraph hover and paragraph
  ranges can be wired per section.
- `src/foliate-js/text-walker.js` maps string offsets back to `Range` objects.
- `src/foliate-js/overlayer.js` and the `Overlayer` usage in `Reader.tsx` show
  how foliate draws highlights, if the CSS Custom Highlight API ever needs a
  fallback.
- `useLLMSettings.ts` + `llmClient.ts` already resolve a provider/model per
  use case; the same pattern carries over to a dedicated `useSpeechSettings`.

## UX design (recommended)

### Starting playback — paragraph or chapter

Per review, "Read from here" is the only start action, and it starts from a
paragraph or a chapter. There is no idle floating button and no selection-bar
action.

1. **Paragraph hover play (primary).** Hovering a paragraph block shows a
   small circular play button in the left margin, aligned with the paragraph's
   first line. Click starts reading at that paragraph. It is rendered by React
   in the parent layer over the section iframe (no DOM mutation inside the
   book) and hides while the user is selecting text, when the pointer leaves
   the block, and while the player is in an error state.
2. **Chapter play (Contents sidebar).** Each row in `TocTree.tsx` gets the
   same play affordance (hover-revealed on desktop, always visible on the
   active chapter for touch). Clicking resolves the href through
   `book.resolveHref`, navigates to that chapter, and starts at its first
   paragraph. Rows below the book's "A chapter is" depth start inside the
   chapter; playback still stops at the enclosing scope's end.

#### EPUB block model (what counts as a paragraph)

EPUB 2 content documents are XHTML 1.1 and EPUB 3 documents are XHTML5 (or
SVG); the semantic paragraph is `<p>`. The other reading blocks are
`h1–h6`, `ul/ol/li`, `blockquote`, `figcaption`, `dt/dd`, and table cells.
Real-world books are messier: conversions by Calibre/InDesign often use
`<div class="calibreN">` as a paragraph wrapper, `<br>`-split lines, or bare
text under `div/section/article`, so a tag list alone is not enough.
Detection is two-tier:

1. Semantic candidates in document order: `p`, `h1–h6`, `li`, `blockquote`,
   `figcaption`, `dt`, `dd`, `pre`, `td`, `th`.
2. Fallback leaf blocks: `div`, `section`, `article` with non-whitespace
   direct text and no candidate descendants, treated as paragraphs.
3. De-duplication: only the innermost candidate blocks are read; when a
   candidate contains child blocks, its own direct text around them becomes
   its own block so nothing is skipped or read twice.
4. Skip: `script/style/nav/aside`, hidden or `aria-hidden` content, footnote
   apparatus (`aside` / `epub:type="footnote"`) in v1, and empty blocks.

### The footer player

Per review, the player lives at the bottom, in the footer where the bookmark
and reading progress already are. `ReaderPage` lifts the `useReadAloud` hook
and passes the player to the footer and the reader.

While active, the footer's control row becomes:

```
[ prev paragraph ] [ play/pause ] [ next paragraph ]   [ stop ]
```

- **play/pause**: spinner while a paragraph's first audio is being generated;
  pause keeps the paragraph highlighted.
- **prev / next**: move a whole paragraph at a time, stepping across pages and
  scopes through the player. Cached audio replays instantly. No speed control
  in v1 (per review).
- **stop**: ends playback, clears the highlight, and restores the normal
  footer (bookmark, go-to-bookmark, location, percent).
- **chapter end**: the control row becomes "Chapter finished" with
  **Read next chapter** and stop buttons.
- **error**: short message ("Voice unavailable — check the speech provider in
  Settings") plus retry and stop.

The chapter label stays on the left and the progress bar stays below; only the
right cluster swaps, so the footer keeps its height and the book does not
reflow. On mobile the controls stay icon-only and thumb-reachable. Buttons
get `aria-label`s, play/pause gets `aria-pressed`, and the group is labelled
"Read aloud".

The player owns page navigation while it runs (see below), so the header's
page chevrons are hidden and the footer is the only visible control surface.

### Highlight and follow

- **Paragraph-level highlight** (per review: no per-word or per-sentence
  highlight) via the CSS Custom Highlight API (`CSS.highlights` +
  `::highlight(read-aloud)`), applied per section document with an injected
  style. No DOM mutation, no interference with user highlights or
  annotations. A soft translucent green distinct from the four user highlight
  colors; a non-transparent underline variant is a fallback if colors muddy
  on dark themes.
- **Auto-follow**: scroll to the paragraph through
  `renderer.scrollToAnchor(range)` only when the paragraph changes, so there
  is no per-sentence jitter. Page turns happen in paginated mode; scroll mode
  scrolls. Audio is fetched one paragraph at a time, matching the highlight
  granularity.
- If the Custom Highlight API is unavailable (non-Chrome), playback still
  works, just without the spoken-paragraph highlight in v1.

### Edge cases and interactions

- Making a text selection while playing **pauses** playback, so the selection
  bar and highlight popup are not fighting the moving highlight.
- **The player owns navigation while playing.** Manual page turns are blocked:
  the header chevrons are hidden and the arrow-key handler checks the playback
  flag and ignores the key. To navigate manually the reader must stop the
  player first; TOC and bookmark jumps stop playback and then perform the
  jump.
- Stop restores the header chevrons, keyboard navigation, and the footer's
  bookmark/location cluster.
- The first `play()` after an async fetch is the one autoplay-policy risk;
  mitigation is to unlock the reused `<audio>` element synchronously in the
  click handler with a zero-length/silent source.
- Stop is the only exit; no new global keyboard shortcut in v1.
- Chapter boundaries follow the per-book "A chapter is" scope: the stop point
  is the last paragraph of the scope, computed from `resolveScopeEntry` /
  `flattenTocWithDepth` with the same next-entry logic as
  `loadTocScopedText`, extended across sections when a chapter spans more than
  one spine item.

## Voice engine (cloud, new provider)

### OpenRouter's TTS standard (researched)

OpenRouter ships a dedicated text-to-speech endpoint that is explicitly
compatible with the OpenAI Audio Speech API:

- `POST https://openrouter.ai/api/v1/audio/speech`
- Request: `model`, `input` (string, or an array of turns for multi-speaker
  models), `voice` (provider-dependent and generally required), optional
  `instructions`, `response_format` (`mp3` or `pcm`, default `pcm`), `speed`.
- Response: a raw audio byte stream (`X-Generation-Id` header), not JSON.
- Model discovery: `GET /api/v1/models?output_modalities=speech`.
- Models include `openai/gpt-4o-mini-tts-*`, `google/gemini-*-tts`,
  `mistralai/voxtral-mini-tts-*`. Cost is on the order of one cent per minute
  of audio for the cheaper models (OpenRouter's own cookbook quotes ~$0.0074
  for 49 seconds).

Because the shape is OpenAI-compatible, one adapter covers OpenAI, OpenRouter,
and any compatible endpoint; only the base URL, key, model naming, and voice
list differ.

### New speech provider in Settings

A separate **Speech** provider section, independent of the LLM provider:

- Provider preset: **OpenRouter** (default, model discovery works),
  **OpenAI**, or **Custom (OpenAI-compatible)**.
- Its own base URL, API key, `model`, and `voice`.
- "Load voices/models" uses `output_modalities=speech` on OpenRouter and the
  plain models list elsewhere; the voice stays a free-text field with the
  model's documented examples, because voices are per model.
- A **Test voice** button synthesizes one fixed sentence so users can pick a
  model/voice without opening a book.
- Copy notes that the speech key is separate and that reading aloud sends text
  to that provider and bills per character/minute.

### Playback flow, paragraph by paragraph

Per review, playback works from a paragraph breakdown, not opaque
sentence-at-a-time requests:

1. When the reader starts at a paragraph, the scope (remaining chapter) is
   broken into a queue of paragraphs.
2. Each paragraph is synthesized through the speech provider and played to the
   end; the player emits `paragraph-start` when a paragraph begins, which is
   what moves the highlight.
3. The next paragraph is prefetched while the current one plays, so gaps stay
   small.
4. At the last paragraph of the chapter scope, the player stops and shows the
   "Chapter finished" prompt. The provider is never asked to play past the
   scope.

One honest limitation to call out: **no TTS API (OpenRouter included) emits
playback boundary events or paragraph timings.** Multi-speaker `input` arrays
change voices, not timing. So the sync signal cannot come from the provider;
the app requests paragraphs one by one and the request boundary *is* the
event. That is what makes the highlight exact without forced alignment.
Paragraphs longer than the model's per-request input limit are split into
sub-requests while the highlight stays on the paragraph.

- **Cache**: paragraph blobs cached in memory keyed by
  `provider|model|voice|text` for the session, so prev/next and replays never
  re-bill. A persistent IndexedDB cache is a follow-up, not v1.
- **Errors**: unsupported model, missing voice, or a provider that rejects
  audio produce a distinct, actionable message (401/402/404/429 mapped from
  the standard error shape).
- **Privacy note**: the README promise ("only external call is the LLM API")
  needs a clarifying sentence: reading aloud sends the visible text to the
  configured speech provider.

## Architecture

```
ReaderPage.tsx (owns viewRef, lifts the player state)
 ├─ useReadAloud(viewRef)                    hook: state machine + audio queue
 │   ├─ ttsChunker.ts                        section → blocks → paragraphs + ranges
 │   ├─ speechService.ts                     text → mp3 Blob via provider
 │   └─ audio cache                          Map<key, blob URL>, LRU
 ├─ Footer.tsx (+ PlayerControls.tsx)        play/pause, prev/next paragraph,
 │                                           stop, chapter end, error
 ├─ Reader.tsx                               load listeners, paragraph hover
 │                                           affordance, pause-on-selection
 └─ TocTree.tsx                              "Read from here" per chapter row
```

- `load` event → cache the section doc, attach `mouseover`/`mouseleave` for
  the hover affordance, inject the highlight style.
- Hover position math: `doc.defaultView.frameElement.getBoundingClientRect()`
  (same-origin section iframe) + the block's rect. Risk to verify early; if
  `frameElement` is null, fall back to injecting a button into the section
  document.
- `useReadAloud` is the only stateful piece: section block/paragraph lists,
  current paragraph index, play token for race protection, `AbortController`
  per fetch, and one reused `HTMLAudioElement`. It also resolves the chapter
  scope's section range. No store slice needed; only voice settings are
  persisted.

## Alternatives considered (and why rejected)

- **Iframe-injected hover button** instead of a parent-layer overlay: simpler
  coordinates, but book-DOM mutation can confuse foliate's annotations and
  text walker; parent overlay keeps all UI in React.
- **Wrapping the spoken paragraph in a `<span>`**: guaranteed to break ranges
  and foliate's annotation mapping after the first update. The Custom
  Highlight API and Overlayer are the only safe options for the single
  paragraph highlight.
- **Floating pill and header player**: both rejected; review placed the
  player in the footer, next to the bookmark and progress it replaces while
  active.
- **Idle floating button and selection-bar action**: dropped — the review
  scoped starting to exactly two surfaces, a paragraph or a chapter.
- **Browser `speechSynthesis`**: free but inconsistent voices, no SSML, real
  Chrome pause bugs, and no path to the quality the user chose. Rejected in
  favor of cloud.
- **Auto-continue across chapters**: rejected; stopping with an explicit
  "Read next chapter" prompt keeps the reader in control.
- **Speed control**: dropped for v1 per review; neither the provider `speed`
  parameter nor `audio.playbackRate` is exposed yet.
- **Word/sentence-level highlight**: impossible with pre-generated audio
  without forced alignment, and review asked for paragraph-level only;
  paragraph is the contract.

## Still-standing challenges (top risks)

1. **Autoplay after async fetch** — first `play()` may be blocked; silence-unlock
   mitigation above, verify on Chrome.
2. **Iframe hover coordinates** — `frameElement` availability must be
   confirmed against foliate's renderer early.
3. **Provider compatibility** — most OpenAI-compatible endpoints do not
   implement `/audio/speech`; the new Speech provider section removes the
   ambiguity, with OpenRouter and OpenAI as first-class presets.
4. **Cost** — per-character billing for a full book is real; the session cache
   mitigates replays, and Settings must say costs are the provider's.
5. **Persisted settings migration** — keep it simple: read the new fields
   with defaults and let old snapshots fall back; no migration machinery
   unless it stays trivial.
6. **Paragraph hover usability in paginated mode** — paragraphs split across
   columns; the hovered block's rect may be off-page. Use the first rect and
   show only the button on hover; the paragraph highlight is playback-only.
7. **No provider timing events** — OpenRouter's multi-speaker `input` changes
   voices, not timing; paragraph sync stays app-side and must be designed
   around that, not around imagined provider callbacks.

## Files to modify

- `src/types/index.ts` — `SpeechProviderConfig` (preset, base URL, key,
  model, voice), speech settings in `ReaderSettings`, renderer
  `scrollToAnchor`, `FoliateView` load event notes.
- `src/constants/index.ts` + `src/constants/routes.ts` — default speech
  provider and the new Settings tab entry.
- `src/services/speechService.ts` (new) — OpenRouter/OpenAI-compatible
  `/audio/speech` client, model discovery (`output_modalities=speech`), error
  mapping.
- `src/hooks/useSpeechSettings.ts` (new) — resolves the speech provider.
- `src/utils/ttsChunker.ts` (new) — blocks → paragraphs + ranges.
- `src/hooks/useReadAloud.ts` (new) — paragraph queue, playback state machine,
  paragraph-start events.
- `src/components/reader/PlayerControls.tsx` (new) — footer player controls.
- `src/components/reader/ParagraphPlayButton.tsx` (new).
- `src/components/reader/Reader.tsx` — listeners, hover affordance,
  pause-on-selection.
- `src/components/reader/Footer.tsx` — swap the bookmark/location cluster for
  the player while active.
- `src/components/reader/TocTree.tsx` — per-chapter "Read from here" button.
- `src/pages/reader/ReaderPage.tsx` — lift the player hook, pass it to the
  footer/reader, and block keyboard navigation while playing.
- `src/hooks/useKeyboardNavigation.ts` — honour the playback flag.
- `src/components/settings/tabs/SpeechTab.tsx` (new) + `SettingsPage.tsx` /
  `src/components/settings/index.ts` — provider preset, key, model, voice,
  test button.
- `README.md` — one-line privacy clarification.

## Reuse

- `src/foliate-js/text-walker.js` — string→Range mapping for paragraphs.
- `src/foliate-js/view.js` — `load` and `relocate` events; renderer
  `scrollToAnchor`, `getContents`.
- `src/services/llmClient.ts` — `LLMServiceError`/`formatLLMError` and the
  client-construction pattern for the speech service.
- `src/hooks/useLLMSettings.ts` — pattern for `useSpeechSettings`.
- `src/components/settings/tabs/ModelField.tsx` — model input UI for the
  Speech tab.
- `src/components/reader/TocTree.tsx` — where the chapter start button goes.
- `src/components/common/Button.tsx` / `IconButton.tsx` — footer player
  controls.

## Steps

- [x] Types + defaults: `SpeechProviderConfig`, renderer methods; new fields
      read with defaults (no migration machinery).
- [x] `speechService.ts` + `useSpeechSettings` + error mapping + model
      discovery.
- [x] `ttsChunker.ts`: EPUB block discovery and paragraph ranges for a section
      document.
- [x] `useReadAloud`: paragraph queue, prefetch, cache, token/abort guards,
      paragraph-start events, chapter-end detection.
- [x] Navigation lock: playback flag honoured by `useKeyboardNavigation` and
      the header chevrons; TOC/bookmark jumps stop the player.
- [x] Paragraph highlight: per-section style injection + `CSS.highlights`
      range; `scrollToAnchor` follow on paragraph change only.
- [x] `PlayerControls` with playing/paused/loading/chapter-end/error states,
      mounted in the footer via ReaderPage.
- [x] Paragraph hover affordance + coordinates (spike `frameElement` first).
- [x] Chapter "Read from here" button in `TocTree` + chapter scope range.
- [x] Settings: new Speech tab (preset, key, model, voice, test button),
      cost/privacy copy.
- [x] README privacy sentence.
- [x] Manual verification matrix (below) on Chrome.

## Verification

- `npm run lint` and `npm run build` pass.
- Chrome, real EPUB, Sepia + Dark themes, paginated and scroll modes, at 320
  and 1280 px:
  - Start from paragraph hover mid-chapter; verify audio starts, the
    paragraph highlights, and the view follows on paragraph change.
  - Start from a chapter row in the Contents sidebar; verify navigation to the
    chapter and playback from its first paragraph.
  - Skip prev/next paragraph across paragraph and page boundaries; replay is
    instant and silent on the network.
  - Manual page turns are blocked while playing: chevrons hidden, arrow keys
    ignored; TOC and bookmark jumps stop the player first.
  - Select text mid-playback → playback pauses.
  - Chapter end shows the prompt; "Read next chapter" starts the next scope.
  - Wrong model/voice, missing speech key, and provider without audio produce
    the actionable error states.
  - Footer at 320 / 375 / 768 / 1280 px while playing: controls fit, no
    reflow of the book, bookmark/progress restored after stop.
  - Regression: bookmarks, highlights, chat, and page turns behave as before
    while the player is idle.

## Open decisions

1. **Default speech preset**: OpenRouter (recommended — model discovery via
   `output_modalities=speech` and cheap TTS models) or OpenAI (`tts-1` /
   `gpt-4o-mini-tts`)?
2. **Chapter start surface**: the Contents sidebar row button (recommended)
   or an idle footer play button that starts at the current chapter's top?
3. **Footnotes and asides**: skip in v1 (recommended) or read them inline?

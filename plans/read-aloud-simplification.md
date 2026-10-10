# Simplify `useReadAloud.ts` and document the audio flow

## Context

Plannotator review (pn-58cf6e) on `src/hooks/useReadAloud.ts`:

> in general we need to simplify this, try to make it more simple as a file even as
> have the core of the read aloud. also on top, add a comment where it explain the
> flow of the audio, how it gets the text, generate audio etc

This is a maintainability request, not a bug report.

### Verdicts

- **"Simplify the file" — Confirmed (introduced).** `useReadAloud.ts` is a new
  724-line file mixing six concerns: chapter-scope math, CSS highlight, audio
  element lifecycle, blob-URL cache/prefetch, playback state machine, controls.
- **"Add an audio-flow comment" — Confirmed (introduced).** Only a 3-line JSDoc on
  the hook exists (`:126-129`); no end-to-end description of how text becomes audio.
- **Adjacent dead API — Confirmed (introduced).** `paragraphIndex`,
  `paragraphCount`, `currentRange` are on the exported `ReadAloudPlayer` but used
  by no component outside the hook.

Decisions: **moderate extraction**, **remove unused public fields**, strictly
behavior-preserving except for the small cleanups listed as optional.

## Approach

Keep the playback state machine (queue, index, scope, `load` events, navigation)
in `useReadAloud.ts`; extract the self-contained pieces into focused modules.
The hook should read as: get a section doc → build a paragraph queue → for each
paragraph, fetch+cache audio, play it, highlight/follow, prefetch next → advance
or hand off to the next section.

### New / changed modules

**1. `src/utils/tocUtils.ts` — chapter scope (pure)**
Move from `useReadAloud.ts` and export:
- `interface ChapterScope { start: number; end: number }`
- `isDescendantOf(entry, ancestor, entries)` (private)
- `computeChapterScope(book, toc, href, depth): ChapterScope | null`

Reuses the file's existing `resolveScopeEntry` and `flattenTocWithDepth`; adds a
`Book` type import. Behavior of the current implementation is preserved exactly.

**2. `src/hooks/useParagraphHighlight.ts` (new) — CSS Custom Highlight**
Move `HIGHLIGHT_STYLE_ID`, `injectHighlightStyle`, `HighlightCapableWindow`, and
the `useEffect` that sets/clears `CSS.highlights["read-aloud"]`.
Public API: `useParagraphHighlight(range: Range | null): void`.

**3. `src/services/speechAudio.ts` (new) — the reused `<audio>` element**
Move `SILENT_AUDIO` and the audio element lifecycle into a small class:
- `new SpeechAudio(onEnded)` registers the `ended` listener
- `unlock()` — silent-WAV autoplay unlock, guarded by the same
  `dataset.unlocked` / `src === unlockSrc` logic
- `play(url): Promise<void>` — set `src`, reset time, `play()`
- `resume(): Promise<void>`, `pause()`, `stop()` (pause + clear src + load)
- `dispose()` — remove listener + stop

**4. `src/services/speechCache.ts` (new) — session blob-URL cache**
Move `cacheRef`/`inFlightRef`/`abortRef`, `trimCache`, `cacheKeyFor`,
`requestParagraphUrl`, `abortAll` into a `SpeechCache` class:
- `key(text, settings)`, `get(paragraph, settings): Promise<string>`
- `prefetch(paragraph, settings): void` (silent failures)
- `abortAll()` — abort in-flight, keep cached URLs (used by `stop`)
- `dispose()` — abort + `URL.revokeObjectURL` all + clear (used on unmount)
- `CACHE_LIMIT = 200` moves here.

**5. `src/hooks/useReadAloud.ts` — the core**
- Add the top-of-file flow comment (see below).
- Lazily create one `SpeechCache` and one `SpeechAudio` in refs
  (`getCache()` / `getAudio()`); dispose both on unmount.
- Delete the moved code, the `ended` effect, and the highlight effect.
- Collapse `pendingRef` + `pendingHrefRef` into one ref object
  `{ kind: "start" | "continue"; href: string | null } | null`.
- Keep `paragraphIndex`/`paragraphCount`/`currentRange` as internal state; remove
  them from the exported `ReadAloudPlayer` interface.
- Optional cleanups (behavior-preserving): `toggle` calls `pause()` instead of
  duplicating the pause branch.

### Top-of-file comment (draft)

```
/**
 * Read-aloud player: turns the rendered book into spoken paragraphs.
 *
 * Flow
 * 1. The foliate view emits a `load` event per rendered section with its
 *    iframe Document. We keep that doc + section index.
 * 2. Starting (paragraph hover or TOC chapter) unlocks the shared <audio>
 *    element inside the user gesture, resolves the chapter scope, and builds
 *    an ordered queue of paragraphs with `extractParagraphs(doc)`.
 * 3. Playing index N asks SpeechCache for a blob URL. The cache returns a
 *    cached URL, joins an in-flight request, or calls `generateSpeech`
 *    (OpenAI-compatible /audio/speech). The next paragraph is prefetched while
 *    N plays, so gaps stay small.
 * 4. The URL is set on the <audio> element and played; the paragraph's Range is
 *    highlighted via the CSS Custom Highlight API and scrolled into view.
 * 5. On `ended`, advance to N+1. After the last paragraph, the player goes to
 *    the next section in the scope and continues, or shows "Chapter finished".
 * 6. Stop aborts in-flight requests and keeps cached URLs; unmount revokes
 *    every blob URL.
 *
 * Navigation belongs to the player while it is active.
 */
```

## Files to modify

- `src/hooks/useReadAloud.ts` — shrink to the state machine + navigation.
- `src/utils/tocUtils.ts` — add `ChapterScope` + `computeChapterScope`.
- `src/hooks/useParagraphHighlight.ts` (new) — highlight effect.
- `src/services/speechAudio.ts` (new) — `<audio>` lifecycle.
- `src/services/speechCache.ts` (new) — blob-URL cache + prefetch.

## Reuse

- `resolveScopeEntry`, `flattenTocWithDepth` — `src/utils/tocUtils.ts`
- `generateSpeech`, `SpeechRequestSettings` — `src/services/speechService.ts`
- `extractParagraphs`, `paragraphRange`, `ReadAloudParagraph` — `src/utils/ttsChunker.ts`
- `LLMServiceError`, `formatLLMError` — `src/services/llmClient.ts`

## Steps

- [x] Add the top-of-file audio-flow comment.
- [x] Move chapter-scope helpers to `tocUtils.ts`.
- [x] Create `speechCache.ts` and use it from the hook.
- [x] Create `speechAudio.ts` and use it from the hook (drop the `ended` effect).
- [x] Create `useParagraphHighlight.ts` and call it from the hook.
- [x] Collapse the two pending refs; remove `paragraphIndex`/`paragraphCount`/
      `currentRange` from the exported interface.
- [x] Optional: `toggle` delegates to `pause`.
- [x] Run lint, typecheck, and build.

## Verification

- [x] `npm run lint`
- [x] `npm run build` (`tsc && vite build`)
- [ ] Manual smoke test in the reader:
  - [ ] Start from paragraph hover; start from TOC "Read from here".
  - [ ] Prev/next across pages and into the next section; cached replays instant.
  - [ ] Pause, resume, stop, retry after error.
  - [ ] Chapter end → "Read next chapter".
  - [ ] Highlight + auto-follow move with each paragraph.
  - [ ] Selection pauses playback; player UI still renders in the footer.

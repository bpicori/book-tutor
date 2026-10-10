# Read-aloud UI fixes: text jump + playback speed

Status: ready for review.

## Context

Pressing play highlights the paragraph, then the text moves; stopping moves it
back. The reader is foliate in paginated mode, so a container resize
re-columnizes the section and the paragraph lands on another page.

User also wants a playback speed control: **1x, 1.25x, 1.5x, 2x**.

## Root cause (confirmed by reproduction timing)

- The move happens exactly when playback starts and reverses when it stops.
- `Footer.tsx` swaps the bookmark cluster for `PlayerControls` when
  `player.isActive`:
  - idle row: 28 px (`h-7` bookmark buttons)
  - active row: 32 px (`h-8` control buttons)
- The footer grows ~4 px, the `Reader` flex area shrinks, foliate's
  `ResizeObserver` (`src/foliate-js/paginator.js:430`) re-columnizes, and
  `expand()` re-scrolls to its anchor — the paragraph moves.
- The CSS Custom Highlight API is layout-neutral; it only makes the move
  visible.

## Fix 1 — keep the footer height constant

- Give the footer's top row a fixed height (`h-8`) in `Footer.tsx` for both the
  bookmark cluster and `PlayerControls`, so idle / loading / playing / error /
  chapterEnd all measure 32 px.
- Then activating or stopping the player cannot resize the reader, foliate
  never re-columnizes on play, and the paragraph stays put.
- Header is already stable: it keeps a left `IconButton` and `min-h-14`, so
  hiding the right-side buttons while reading does not change its height.

## Fix 2 — playback speed control

### Audio

- `SpeechAudio` gains `setRate(rate)` and remembers the rate.
  - Sets both `defaultPlaybackRate` and `playbackRate` on both elements.
  - Re-applies the rate in `play()`: `HTMLMediaElement.load()` (called by
    `stop()`) resets `playbackRate` to `defaultPlaybackRate`, so the rate must
    survive stops and element swaps.
  - Pitch stays natural: `preservesPitch` defaults to true.
- Changing speed mid-paragraph applies immediately; no restart.

### State and persistence

- Add `PlaybackSettings { playbackRate: number }` and include it in
  `ReaderSettings`, with `playbackRate: 1` in `DEFAULT_SETTINGS`. The existing
  zustand `persist` layer stores it automatically.
- Read it in `useReadAloud` with `?? 1` so old persisted settings without the
  field keep working, and expose `playbackRate` + `setPlaybackRate` through
  `ReadAloudPlayer`.
- `setPlaybackRate` calls `updateSettings({ playbackRate })` (existing
  `uiSlice` action) and `getAudio().setRate(rate)` so playback updates live.
- Apply the stored rate whenever the `SpeechAudio` instance is created.

### UI

- Add a compact cycling button to the transport row in `PlayerControls.tsx`:
  `1x → 1.25x → 1.5x → 2x → 1x`, label showing the current rate.
- Keep it `h-8` so it does not affect the footer row height, with
  `aria-label` and `title` ("Playback speed").
- Show it in the loading / playing / paused row; not in error or chapterEnd.

## Files to modify

- `src/components/reader/Footer.tsx` — fixed-height top row.
- `src/components/reader/PlayerControls.tsx` — speed button.
- `src/services/speechAudio.ts` — `setRate` and rate re-application.
- `src/hooks/useReadAloud.ts` — read/set rate, apply to audio, expose in API.
- `src/types/index.ts` — `PlaybackSettings`, `ReaderSettings` extension.
- `src/constants/index.ts` — `playbackRate: 1` in `DEFAULT_SETTINGS`.

## Reuse

- `updateSettings` from `src/store/slices/uiSlice.ts` for persistence.
- `CONTROL_BUTTON` / `TEXT_BUTTON` styles in `PlayerControls.tsx`.
- `SpeechAudio` two-element swap from the previous plan; rate is just a
  property on both elements.

## Steps

- [x] 1. Fix the footer row height (`h-8`) and verify idle/active/error/
  chapterEnd all measure the same; text no longer moves on play or stop.
- [x] 2. Add `PlaybackSettings` to `ReaderSettings` and `playbackRate: 1` to
  `DEFAULT_SETTINGS`.
- [x] 3. Add `setRate()` to `SpeechAudio` (both elements,
  `defaultPlaybackRate` + `playbackRate`, re-applied in `play()`).
- [x] 4. Wire `playbackRate` / `setPlaybackRate` through `useReadAloud` and
  the `ReadAloudPlayer` interface.
- [x] 5. Add the cycling speed button to `PlayerControls`.
- [x] 6. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, then
  the manual checks below.

## Verification

- Measure `footer.getBoundingClientRect().height` while idle, playing, paused,
  error, and chapterEnd — all equal; the book text does not shift when play
  starts or stops.
- Speed: cycle to 1.5x while playing — rate changes immediately; next
  paragraph keeps it; stop and restart keeps it; reload keeps it.
- 2x stays intelligible (pitch preserved).
- Chapter transition, prev/next, and pause/resume keep the selected rate.
- Mobile width: the speed button fits the footer row.

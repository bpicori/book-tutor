# TTS request strategy, persistent speech cache & gapless playback

Status: ready for review. Decisions from discussion folded in.

## Context

Read-aloud synthesizes one paragraph per request and prefetches exactly one
paragraph ahead. The question was: keep per-paragraph, prefetch deeper, or batch
5–10 paragraphs per call. Goals, in order: minimize billed synthesis, then
gapless playback.

## Decisions

- Provider: **OpenRouter + Gemini TTS** (`google/gemini-3.8-flash-lite-tts`,
  PCM 24 kHz mono, wrapped to WAV by `speechService.ts`).
- **Per-paragraph requests; no bulk batches.**
- Prefetch lookahead stays **1**, but starts only after playback actually begins.
- Persistent IndexedDB cache with a **128 MB** LRU cap.
- **Gapless two-element swap ships in this plan** (Phase 2).

## Findings that drive the design

- OpenRouter TTS is priced **per character of input text** (verified in
  OpenRouter's TTS docs). Cost follows characters **sent**, not played. The two
  levers: never re-send cached text, and don't send text about to be skipped.
- Batching does not reduce characters for listened text, increases characters
  billed on early stop (up to 9 unplayed paragraphs), breaks per-paragraph
  highlight/auto-follow/prev/next/retry since responses have no timings, and
  runs into provider input limits. OpenRouter's own docs recommend splitting
  long inputs.
- Current prefetch fires **before** the current paragraph starts playing
  (`useReadAloud.ts:233`), so a burst of next/prev clicks issues a synthesis
  request per click — the wrong pattern for skip-heavy use.
- The cache is in-memory only (`CACHE_LIMIT = 200` URLs). Reopening a book or
  reloading re-bills every paragraph.
- The next section can be read without rendering it:
  `book.sections[i].createDocument()` is already used this way in
  `src/utils/chapterContent.ts:75`; only its paragraph text is needed to warm
  the cache.
- One `<audio>` element cannot preload the next paragraph without replacing the
  current source, so a second unlocked element is what makes preload-ahead and
  gapless swaps possible.

## Approach

### 1. Prefetch discipline (cost)

- Replace the current immediate `prefetchIndex(index + 1)` with a cancelable
  `setTimeout` of ~800 ms started **after** `updateStatus("playing")`.
- Clear the timer on pause, skip (prev/next), stop, and any token change; on
  resume, schedule it again.
- When the timer fires, `SpeechCache.get(next)` and, if the token is still
  current and the player is playing, `SpeechAudio.preload(url)`.
- On the last paragraph of a section, run the cross-section warm-up instead.

### 2. Persistent LRU cache (cost + UX)

- New IndexedDB database `read-with-ai-speech` (separate from the book DB):
  - `meta` keyed by `id` → `{ id, bookId, bytes, lastUsed }`, with indexes
    `by_bookId` and `by_lastUsed`.
  - `audio` keyed by `id` → `{ id, blob }`.
- `id = sha256(baseUrl|model|voice|bookId|text)` via `crypto.subtle`; plain
  composite string fallback when `crypto.subtle` is unavailable.
- `SpeechCache.get()` order: memory URL → IndexedDB blob (create URL, touch
  `lastUsed`) → in-flight promise → network. Network results are written
  through to IndexedDB fire-and-forget; quota errors are swallowed.
- Trim after writes by cursor over `by_lastUsed`: delete oldest records from
  both stores until total `bytes` is under `SPEECH_CACHE_MAX_BYTES`, itself
  bounded by 25% of `navigator.storage.estimate().quota` when available.
- `removeBook(bookId)` purges a book's records; called from the library delete
  flow (`LibraryPage.tsx:31`) next to `deleteBookFile(bookId)`.
- `navigator.storage.persist()` requested once on first cache write.
- `dispose()` still revokes in-memory URLs on unmount; IndexedDB survives.

### 3. Cross-section warm-up (gapless)

- When the last paragraph of a section starts playing and the scope has a next
  section, `book.sections[next].createDocument()` → `extractParagraphs(doc)` →
  first paragraph text → `SpeechCache.get(...)` and `SpeechAudio.preload(url)`.
- The live `Range` is rebuilt when the reader renders the section; only the
  cached text and preloaded URL cross the boundary.

### 4. Gapless two-element swap (Phase 2)

- `SpeechAudio` owns two `HTMLAudioElement`s, `active` and `idle`.
- `unlock()` unlocks **both** inside the same user gesture (muted silent clip
  per element, existing `dataset.unlocked` guard per element).
- `preload(url)` puts `url` on the idle element (`src`, `currentTime = 0`,
  `load()`), remembering `preloadedUrl`.
- `play(url)`: if the idle element already holds `url`, swap `active`/`idle`,
  pause the old active, and `await play()` immediately; otherwise set the source
  first. The `ended` listener only advances when `event.target` is the active
  element.
- If `play()` rejects (autoplay policy), retry once on the other element before
  surfacing an error, preserving the current single-element behavior as fallback.
- `pause/resume/stop/dispose` operate on the active element; `stop` clears both
  sources and calls `load()`.

## Why not bulk batching (5–10 paragraphs per call)

| | Per-paragraph + prefetch 1 | Bulk 5–10 |
|---|---|---|
| Characters billed for listened text | same | same |
| Characters billed on early stop | ≤1 unplayed | up to 9 unplayed |
| Highlight / follow / prev-next / retry | exact, per paragraph | broken or heuristic |
| Provider input limits | never hit | 4096-char-class limits force splitting |
| First audio latency | one short request | waits for whole batch |
| Failure blast radius | one paragraph | whole batch |

## Files to modify

- **`src/services/speechStore.ts` (new)** — IndexedDB open/upgrade, `getBlob`,
  `putBlob`, `touch`, LRU trim, `removeBook`, `clear`, `persist` request,
  `crypto.subtle` key hashing.
- **`src/services/speechCache.ts`** — backed by `speechStore`; `get` is
  memory → IDB → in-flight → network; `prefetch` resolves to the URL (or
  `undefined`); memory trim and abort semantics unchanged.
- **`src/services/speechAudio.ts`** — two-element ping-pong, `preload`,
  guarded `ended`, autoplay fallback.
- **`src/hooks/useReadAloud.ts`** — cancelable 800 ms prefetch timer,
  cross-section warm-up, `bookId` from the store, clear timers on
  pause/skip/stop, `preload` on prefetch resolution.
- **`src/pages/library/LibraryPage.tsx`** — purge speech cache when a book is
  deleted.
- **`src/constants/index.ts`** — `SPEECH_CACHE_DB_NAME`,
  `SPEECH_CACHE_MAX_BYTES = 128 * 1024 * 1024` (alongside existing DB constants).

## Reuse

- `src/store/bookStorage.ts` — IndexedDB open/upgrade/`dbCache` pattern.
- `src/utils/ttsChunker.ts` — `extractParagraphs(doc)` for warm-up text.
- `src/utils/chapterContent.ts:75` — `section.createDocument()` usage.
- `useStore.currentBookId` for cache scoping and per-book purge.
- `SpeechCache.inFlight` / `controllers` for dedupe and abort.

## Steps

- [x] 1. Add `speechStore.ts` + constants (IDB stores, hashing, byte-capped LRU
  trim, per-book purge, `storage.persist()`).
- [x] 2. Back `SpeechCache` with `speechStore`; memory → IDB → in-flight →
  network; write-through; `prefetch` returns the URL.
- [x] 3. Add two-element ping-pong and `preload()` to `SpeechAudio`
  (unlock both, guarded ended, autoplay fallback).
- [x] 4. Replace immediate prefetch with the cancelable 800 ms timer after
  playback starts; wire `preload`; clear on pause/skip/stop.
- [x] 5. Add cross-section warm-up on the last paragraph of a section.
- [x] 6. Purge a book's cached audio when it is deleted from the library.
- [x] 7. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, then
  the manual checks below.

## Verification

- Cost: play one paragraph normally → current + exactly one prefetch (in the
  Network tab); click next 5× quickly → no more than one prefetch per
  actually-played paragraph.
- Persistence: DevTools → Application → IndexedDB → `read-with-ai-speech`
  shows records after playback; reload, reopen the book, replay a chapter →
  no `/audio/speech` requests, instant start.
- LRU: feed more than 128 MB through the cache; oldest records disappear from
  both stores and memory stays bounded.
- Purge: delete a book from the library → its records are gone.
- Gapless: consecutive paragraphs play with no audible silence; chapter
  transition after warm-up starts immediately; `prev/next` mid-paragraph swaps
  cleanly.
- Autoplay: first start still needs the user gesture; playback continues after
  it on Chrome and Safari (Phase 2 check).
- Stop during playback → no pending prefetch is written to the cache.

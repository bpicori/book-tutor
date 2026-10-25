# Privacy

Book Tutor is local-first. There is no backend, no account, no analytics, and no tracking of any
kind. You can verify that by reading the source — `src/` contains no analytics SDK and no
first-party network calls other than the ones below.

## What stays on your device

Stored in your browser, never uploaded by the app:

- **Books** — the EPUB files themselves, in IndexedDB (`read-with-ai-books`).
- **Reading state** — progress, position, bookmarks, highlights, notes.
- **Lexicon** — saved words, definitions, and review state.
- **Settings** — including your API keys, in `localStorage` (`read-with-ai-storage`).
- **Speech cache** — synthesised audio, in IndexedDB (`read-with-ai-speech`), capped at 128 MB.

None of this is written anywhere else unless you export a backup or configure cloud sync.

## What leaves your device

Only what you configure, and only to the endpoints you set:

| Feature | Request | Destination |
| --- | --- | --- |
| Chapter preview | Chapter text + prompt | Your model base URL |
| Ask | Chapter text, earlier chapter summaries, your question | Your model base URL |
| Define / translate a word | The selected word or phrase | Your model base URL |
| Read aloud | Paragraph text | Your speech base URL |
| Cloud sync (optional) | Compressed backup | The endpoint you enter |

Each request goes directly from your browser to the provider. There is no proxy and no server of
ours in the middle, which also means the provider's own retention policy applies to what you send.

If you use a local model (Ollama, LM Studio), no book text leaves the machine at all.

## Keys

API keys are held in this browser's `localStorage` and sent only in requests to the base URL you
configured. They are not logged, and they are not included in exports unless you choose to include
settings in a backup.

## Your choices

- **Delete a book** — removes the EPUB, its reading state, and its cached audio from the device.
- **Reset everything** — Settings → Data → Reset removes books, lexicon, and settings.
- **Backup** — Settings → Data exports one file containing your library. Treat it as sensitive: it
  contains your books and your notes.

## Limits of a browser

- Anything that can run JavaScript on the page can read local storage; keep the app updated and be
  careful with browser extensions on the same origin.
- Safari clears site storage after roughly seven days without a visit. Install the app to your home
  screen, or export a backup regularly.
- Browser storage quotas vary (often ~60% of free disk per origin). Very large libraries may need a
  backup-and-reset cycle.

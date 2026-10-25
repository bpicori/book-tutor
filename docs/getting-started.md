# Getting started

Book Tutor reads EPUB files in your browser. There is no account to create and nothing to install
unless you want the app on your home screen.

## 1. Add a book

Two ways in:

- **Open the sample book** — *The Time Machine* by H. G. Wells (public domain) is bundled so you can
  try the reader and the guide without finding a file first.
- **Add a book** — drop an EPUB or choose one from your device. It is stored in your browser, on
  this device only.

Only EPUB is supported right now, and the file must be DRM-free. If you own a Kindle book, convert
it to EPUB with [Calibre](https://calibre-ebook.com/) first — Book Tutor cannot open DRM-protected
files, and it will not try.

Free, DRM-free sources: [Project Gutenberg](https://www.gutenberg.org/),
[Standard Ebooks](https://standardebooks.org/), and your local library's EPUB lending (Adobe DRM
titles will not open).

## 2. Read

| Control | What it does |
| --- | --- |
| Page arrows / arrow keys | Turn the page |
| `Contents` | Jump to any chapter |
| `Aa` | Typography: font, size, line height, measure |
| Bookmark icon | Bookmark the current page |
| `Listen` | Start read-aloud from here |
| `Guide` | Open the reading guide |

The reading position is saved as you go, so closing the tab and coming back resumes where you were.

## 3. Connect a model

The guide needs a model. Open **Settings → The guide** and pick a preset:

| Preset | Base URL | Key |
| --- | --- | --- |
| OpenRouter | `https://openrouter.ai/api/v1` | [openrouter.ai/keys](https://openrouter.ai/keys) — free models are listed with a `:free` suffix |
| OpenAI | `https://api.openai.com/v1` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Groq | `https://api.groq.com/openai/v1` | [console.groq.com/keys](https://console.groq.com/keys) |
| Ollama | `http://localhost:11434/v1` | Anything — the local server ignores it |
| LM Studio | `http://localhost:1234/v1` | Anything — the local server ignores it |

After pasting a key, press **Load models**. The three model fields fill with the provider's first
model so setup is one click; change any of them:

- **Preview model** — chapter previews and summaries.
- **Ask model** — conversations about the chapter.
- **Definitions model** — definitions and translations.

A chapter preview is a few thousand tokens: roughly **$0.001** on a small model. Local models cost
nothing but are slower. Your key is stored in this browser and sent only to the base URL you set.

## 4. Use the guide

**Preview** reads only the chapter you are in and returns what to notice before you read it:
themes, concepts to carry, tone, characters, terms worth knowing, and questions to hold. Press
**Regenerate** for a different reading.

**Ask** is scoped the same way: the current chapter, plus short summaries of chapters you have
already previewed when *Carry earlier chapter summaries* is on in settings. If the answer is not in
the chapter, the guide says so.

Clicking a question under *Questions to hold* sends it to Ask.

## 5. Read aloud

1. **Settings → Voice** — choose a speech endpoint, key, model, and voice. The default is an
   OpenRouter speech model.
2. Press **Listen** in the reader, or open the player and choose a paragraph or chapter.

Audio is cached on your device (128 MB LRU), so replaying a paragraph you have already heard is
instant and free. Speed is adjustable while playing.

## 6. Keep your words

Select any text in a book:

- **Highlight** — pick a colour; highlights appear in the reader sidebar.
- **Define** — a definition, plus an English gloss for words in other languages.
- **Save to lexicon** — keeps the word, its definition, the source book, and a
  to-review/known state.
- **Ask** — sends the passage to the guide as a question.
- **Copy** — to the clipboard.

The **Lexicon** page groups saved words by letter, filters by review state, and offers practice
cards that hide the definition until you ask for it.

## 7. Back up

**Settings → Data** exports a single backup file: books, progress, highlights, notes, lexicon, and
settings. Import it on another browser or device to move your library.

Do this before clearing site data, and note that Safari removes storage for sites you have not
visited in about a week. Installing the app to your home screen avoids that.

**Settings → Cloud** is optional: it points at a small self-hosted endpoint you run yourself — see
[self-hosting](self-hosting.md).

# Changelog

All notable changes to Book Tutor are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Vocabulary export for Anki (CSV).
- Additional book formats (MOBI, AZW3, FB2, CBZ) — the readers are already bundled.
- More guides: per-chapter preview in a second language.

## [0.1.0] - 2026-10-25

First public release. Everything runs in the browser: books, progress, highlights, and
settings live on your device.

### Added

- **Library** — add EPUBs, covers, progress bars, filters (all/reading/finished), search,
  and a "continue reading" hero.
- **Reader** — paginated and scrolling layouts, single or two-page spread, table of contents,
  resumable reading position, and adjustable typography (font, size, line height, measure).
- **The guide** — spoiler-free chapter previews generated from the current chapter only
  (themes, key concepts, tone, characters, terms, guiding questions).
- **Ask** — per-chapter conversation with the model, scoped to the chapter plus rolling
  summaries of what you have already previewed, so answers cannot spoil later chapters.
- **Listen** — paragraph-level read-aloud from any paragraph or chapter, with configurable
  cloud voice, speed, and a persistent LRU cache of synthesised audio.
- **Selection actions** — translate, highlight, copy, save to the lexicon, or ask about a
  passage.
- **Lexicon** — a vocabulary page with AI definitions, review/known states, search, and
  practice cards.
- **Highlights and notes** in the reader sidebar.
- **Themes and appearance** — light/sepia/dark palettes with customizable typography.
- **Backup** — export and import a full backup (books, progress, vocabulary, settings).
- **Optional cloud sync** — an advanced, self-hosted Cloudflare Worker endpoint.
- **Provider presets** — OpenAI, OpenRouter (including free-tier models), Groq, Ollama,
  LM Studio, or any OpenAI-compatible endpoint. Your key stays in your browser.
- **Installable PWA** — offline shell, home-screen install, automatic updates.

[Unreleased]: https://github.com/bpicori/book-tutor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/bpicori/book-tutor/releases/tag/v0.1.0

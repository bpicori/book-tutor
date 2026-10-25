# Contributing to Book Tutor

Thanks for taking a look. This is a small, deliberately narrow project: a browser-only EPUB
reader with a reading guide. Contributions that keep it local-first, dependency-light, and calm
to read are very welcome.

## Ways to help

- **Report a bug.** Use the bug report template. Include the book format, browser, and what you
  expected to happen.
- **Request a feature.** Open a feature request. Describe the reading problem first, the
  solution second.
- **Improve the guide.** Prompt changes are the highest-leverage changes in this project. If you
  have an idea for a better spoiler-free preview or a better chapter-scoped answer, open an issue
  with before/after examples.
- **Fix documentation.** Typos and unclear setup steps count.

## Development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173/book-tutor/
```

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc`) and produce a production build in `dist/` |
| `npm run preview` | Serve the built app |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with autofix |
| `npm run format` | Prettier |
| `npm run format:check` | Prettier in check mode |

Before opening a pull request, run `npm run lint` and `npm run build`. Both must pass.

### Project layout

```
src/
  components/   UI (library, reader, guide, lexicon, settings, selection bar)
  hooks/        Reader, guide, vocabulary and import hooks
  pages/        Route-level pages (library, reader, settings, vocabulary)
  services/     LLM, prompts, TTS, speech cache, backup, cloud sync
  store/        Zustand store, persistence, IndexedDB book storage
  foliate-js/   Rendering engine (git submodule — see below)
  styles/       Design tokens and per-surface CSS
docs/           User-facing documentation
design/         Original design handoff (reference only)
plans/          Design notes written while building features
cloudflare-worker/  Optional self-hosted sync endpoint
```

`src/foliate-js` is a **git submodule**. Clone with submodules, or run:

```bash
git submodule update --init --recursive
```

## Pull requests

1. Keep the change focused. One concern per pull request.
2. Match the existing style. The UI is intentionally quiet — no new colors, shadows, or
   animations without a reason.
3. No telemetry, analytics, or tracking of any kind. This is a hard rule.
4. No new runtime dependencies unless the feature is impossible without them. Explain why in the
   pull request.
5. Update `README.md` or `docs/` if the change is user-visible, and add a line to
   `CHANGELOG.md` under `[Unreleased]`.

## Commit messages

Conventional Commits, lowercase, imperative:

```
feat: add vocabulary export for Anki
fix: keep reading position when the window is resized
docs: clarify OpenRouter setup
```

## License

Book Tutor is licensed under the **GNU Affero General Public License v3.0**. By contributing, you
agree that your contribution is licensed under the same terms.

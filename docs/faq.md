# FAQ

## Does it work without an API key?

Yes, for reading. The reader, library, typography, highlights, and backups work entirely offline.
The guide's previews, answers, and definitions need a model; the bundled sample book ships with a
few written responses so you can see what the guide does before configuring one.

## Which file formats?

EPUB, DRM-free. The rendering engine also supports MOBI, AZW3, FB2, CBZ, and PDF, and those readers
are already in the build — the import dialog does not accept them yet. Converting with
[Calibre](https://calibre-ebook.com/) takes a few seconds and works today.

## Can I open a Kindle book I bought?

Not directly. Kindle files are DRM-protected, and Book Tutor never tries to bypass that. Buy or
borrow DRM-free EPUBs, or use Calibre only for files you are allowed to convert.

## What does it cost to run?

Nothing for the app. You pay your model provider for the requests the guide makes: a chapter
preview is roughly $0.001 on a small model. Free options: OpenRouter's `:free` models, or a local
model through Ollama or LM Studio.

## Where are my books and keys stored?

In this browser, on this device: books and audio in IndexedDB, everything else in localStorage. See
[privacy](privacy.md).

## Why did my library disappear?

Browsers evict site data. Safari removes storage for sites you have not opened in about a week
unless the app is installed to the home screen; private/incognito windows throw everything away on
close. Export a backup from **Settings → Data** if the library matters to you.

## Does it sync between my laptop and my phone?

Only if you configure the optional self-hosted endpoint (**Settings → Cloud**) or move a backup file
between devices. There is no account and no cloud of ours.

## Can it read aloud for free?

Read-aloud uses a cloud speech endpoint you configure. There is no bundled offline voice. If you
have a local speech server with an OpenAI-compatible API, point **Settings → Voice** at it.

## Which models work best?

Any instruction-following model that can return JSON. Small, fast models are usually enough for a
chapter preview; a better model helps on long chapters and on literary fiction where tone matters.

## Is my reading data used to train anything?

Not by this app — there is no backend and no telemetry. Whatever you send to your model provider is
subject to that provider's policy, so pick one you are comfortable with, or run a local model.

## Can I use it on my phone?

Yes. It is a PWA: open the site, then "Add to Home Screen". The two-page spread becomes a single
page on narrow screens.

## Something is broken. What do you need to know?

The book format, browser and version, whether the guide or the reader is involved, and any red text
in the browser console. Open a
[bug report](https://github.com/bpicori/book-tutor/issues/new?template=bug_report.yml) — please do
not paste book text or API keys.

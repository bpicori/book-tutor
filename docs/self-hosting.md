# Self-hosting

Book Tutor is a static site. Any host that can serve files will do: GitHub Pages, Netlify, Vercel,
Cloudflare Pages, S3, a Raspberry Pi behind Caddy, or a folder on your laptop.

## Build and serve

```bash
git clone --recurse-submodules https://github.com/bpicori/book-tutor.git
cd book-tutor
npm install
npm run build
```

The build lands in `dist/`. Serve it over HTTP — `file://` will not work, because the app uses
service workers, IndexedDB, and ES modules.

```bash
npm run preview         # local preview of the production build
# or
npx serve dist
```

### Hosting in a subdirectory

The app expects the root of a domain. If you serve it from a subdirectory, set `VITE_BASE` when you
build. The value sets the asset base, the router basename, the PWA `scope` and `start_url`, and the
generated `_redirects` file:

```bash
VITE_BASE=/book-tutor/ npm run build
```

### Cloudflare Pages

The public instance runs on Cloudflare Pages at `https://book-tutor.pages.dev/`. Every push to
`main` builds `dist/` and publishes it:

- Workflow: [`.github/workflows/deploy-cloudflare.yml`](../.github/workflows/deploy-cloudflare.yml)
- Secrets: `CLOUDFLARE_API_TOKEN` (permission: Cloudflare Pages → Edit) and `CLOUDFLARE_ACCOUNT_ID`

The build writes `dist/_redirects`, which Cloudflare Pages and Netlify use to send deep links to
`index.html`.

## Optional: sync between devices

The app can upload a compressed backup to an endpoint you control. `cloudflare-worker/` contains a
Cloudflare Worker that stores the backup in an R2 bucket behind HTTP Basic authentication.

```bash
cd cloudflare-worker
npm install
cp config.example.json config.json      # set r2BucketName + workerName
npm run config                          # generates wrangler.toml
npx wrangler r2 bucket create <your-bucket>
npx wrangler secret put AUTH_USERNAME
npx wrangler secret put AUTH_PASSWORD
npm run deploy
```

Then in the app: **Settings → Cloud** → enter the worker URL, username, and password. Upload or
download replaces the whole library backup; it is not a merge.

See [`cloudflare-worker/README.md`](../cloudflare-worker/README.md) for the details.

If you do not want a server at all, skip sync: **Settings → Data → Export** writes a backup file you
can import on another device.

## Privacy note for self-hosters

Self-hosting changes where the app is served from, not what it sends where. Your readers' books still
stay in their browsers, and model requests still go straight to whatever endpoint each reader
configures. If you point people at a shared model key, you are proxying their reading through your
own account — think about that before you do it.

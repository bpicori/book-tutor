# Cloudflare Worker for Book Sync

This Cloudflare Worker provides a simple API for syncing book backups using Basic Auth and R2 storage.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the bucket name:
   - Copy `config.example.json` to `config.json`
   - Edit `config.json` and set your desired R2 bucket name:
   ```json
   {
     "r2BucketName": "your-bucket-name-here",
     "workerName": "book-tutor-sync"
   }
   ```
   - Run `npm run config` to generate `wrangler.toml` from the config
   - Or manually edit `wrangler.toml` if you prefer

3. Create an R2 bucket in Cloudflare Dashboard:
   - Go to R2 in Cloudflare Dashboard
   - Create a bucket with the name you configured in `config.json`

4. Set environment secrets:
```bash
npx wrangler secret put AUTH_USERNAME
# Enter your desired username when prompted

npx wrangler secret put AUTH_PASSWORD
# Enter your desired password when prompted
```

5. Deploy the worker:
```bash
npm run deploy
```
   Note: The `predeploy` script will automatically regenerate `wrangler.toml` from `config.json` before deployment.

## API Endpoints

All endpoints require Basic Auth. Use the username/password you set as secrets.

### POST /backup
Upload a backup file.

**Request Body:**
```json
{
  "version": 1,
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "localStorage": {...},
  "bookFiles": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup uploaded successfully",
  "exportedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /backup
Download the latest backup file.

**Response:**
The full backup JSON object.

### DELETE /backup
Delete the backup file.

**Response:**
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

## Development

Run locally:
```bash
npm run dev
```

Note: You'll need to configure R2 bindings in `wrangler.toml` for local development.


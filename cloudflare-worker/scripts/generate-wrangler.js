#!/usr/bin/env node

/**
 * Generate wrangler.toml from config.json
 * This allows users to configure the bucket name without editing wrangler.toml directly
 */

const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "config.json");
const wranglerPath = path.join(__dirname, "..", "wrangler.toml");

// Read config
let config;
try {
  const configContent = fs.readFileSync(configPath, "utf-8");
  config = JSON.parse(configContent);
} catch (error) {
  console.error(`Error reading config.json: ${error.message}`);
  console.error("Please copy config.example.json to config.json and configure it.");
  process.exit(1);
}

// Validate config
if (!config.r2BucketName || !config.workerName) {
  console.error("config.json must contain 'r2BucketName' and 'workerName'");
  process.exit(1);
}

// Generate wrangler.toml content
const wranglerContent = `name = "${config.workerName}"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# R2 bucket binding
# Generated from config.json - edit config.json to change the bucket name
[[r2_buckets]]
binding = "BACKUPS"
bucket_name = "${config.r2BucketName}"

# Environment variables (set via wrangler secret put)
# AUTH_USERNAME - username for basic auth
# AUTH_PASSWORD - password for basic auth (will be hashed)
`;

// Write wrangler.toml
try {
  fs.writeFileSync(wranglerPath, wranglerContent, "utf-8");
  console.log(`✓ Generated wrangler.toml with bucket: ${config.r2BucketName}`);
} catch (error) {
  console.error(`Error writing wrangler.toml: ${error.message}`);
  process.exit(1);
}


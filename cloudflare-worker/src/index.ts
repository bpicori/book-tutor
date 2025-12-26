/**
 * Cloudflare Worker API for syncing book backups
 * Uses Basic Auth and R2 storage
 *
 * Refactored with SOLID and DRY principles for better maintainability
 * Functional programming style
 */

import { validateAuth, getUsername } from "./authService";
import { uploadBackup, downloadBackup, deleteBackup } from "./backupService";
import { BACKUP_PATHS, HTTP_STATUS } from "./constants";
import { createErrorResponse, createCorsResponse } from "./responseBuilder";

export interface Env {
  BACKUPS: R2Bucket;
  AUTH_USERNAME: string;
  AUTH_PASSWORD: string;
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return createCorsResponse();
  }
  return null;
}

/**
 * Check if path matches backup endpoint
 */
function isBackupPath(path: string): boolean {
  return path === BACKUP_PATHS.BASE || path === `${BACKUP_PATHS.BASE}/`;
}

/**
 * Route request to appropriate handler
 */
async function routeRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) {
    return corsResponse;
  }

  const url = new URL(request.url);
  const path = url.pathname;

  if (isBackupPath(path)) {
    // Validate authentication for backup endpoints
    if (!validateAuth(request, env)) {
      return createErrorResponse("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const username = getUsername(request);

    switch (request.method) {
      case "POST":
        return uploadBackup(request, username, env);
      case "GET":
        return downloadBackup(username, env);
      case "DELETE":
        return deleteBackup(username, env);
      default:
        return createErrorResponse(
          "Method not allowed",
          HTTP_STATUS.METHOD_NOT_ALLOWED
        );
    }
  }

  return createErrorResponse("Not found", HTTP_STATUS.NOT_FOUND);
}

// ============================================================================
// Main Export
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return routeRequest(request, env);
  },
};

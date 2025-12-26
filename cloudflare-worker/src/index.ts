/**
 * Cloudflare Worker API for syncing book backups
 * Uses Basic Auth and R2 storage
 *
 * Refactored with SOLID and DRY principles for better maintainability
 */

import { AuthService } from "./authService";
import { BackupService } from "./backupService";
import { BACKUP_PATHS, HTTP_STATUS } from "./constants";
import { ResponseBuilder } from "./responseBuilder";

export interface Env {
  BACKUPS: R2Bucket;
  AUTH_USERNAME: string;
  AUTH_PASSWORD: string;
}

// ============================================================================
// Router (Single Responsibility: Request Routing)
// ============================================================================

class Router {
  private backupService: BackupService;
  private authService: AuthService;

  constructor(env: Env) {
    this.backupService = new BackupService(env);
    this.authService = new AuthService(env);
  }

  /**
   * Handle CORS preflight requests
   */
  private handleCORS(request: Request): Response | null {
    if (request.method === "OPTIONS") {
      return ResponseBuilder.cors();
    }
    return null;
  }

  /**
   * Check if path matches backup endpoint
   */
  private isBackupPath(path: string): boolean {
    return path === BACKUP_PATHS.BASE || path === `${BACKUP_PATHS.BASE}/`;
  }

  /**
   * Route request to appropriate handler
   */
  async route(request: Request): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = this.handleCORS(request);
    if (corsResponse) {
      return corsResponse;
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (this.isBackupPath(path)) {
      // Validate authentication for backup endpoints
      if (!this.authService.validate(request)) {
        return ResponseBuilder.error("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      const username = this.authService.getUsername(request);

      switch (request.method) {
        case "POST":
          return this.backupService.upload(request, username);
        case "GET":
          return this.backupService.download(username);
        case "DELETE":
          return this.backupService.delete(username);
        default:
          return ResponseBuilder.error(
            "Method not allowed",
            HTTP_STATUS.METHOD_NOT_ALLOWED
          );
      }
    }

    return ResponseBuilder.error("Not found", HTTP_STATUS.NOT_FOUND);
  }
}

// ============================================================================
// Main Export
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const router = new Router(env);
    return router.route(request);
  },
};

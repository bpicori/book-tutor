/**
 * Backup Service
 * Handles backup operations (upload, download, delete) with R2 storage
 */

import type { Env } from "./authService";
import { ResponseBuilder } from "./responseBuilder";
import { HTTP_STATUS, CONTENT_TYPES } from "./constants";

const BACKUP_KEY_PREFIX = "backups/";
const BACKUP_KEY_SUFFIX = ".json.gz";

/**
 * Backup Service (Single Responsibility: Backup Operations)
 */
export class BackupService {
  constructor(private env: Env) {}

  /**
   * Generate backup key for a username
   */
  private getBackupKey(username: string): string {
    return `${BACKUP_KEY_PREFIX}${username}${BACKUP_KEY_SUFFIX}`;
  }

  /**
   * Extract metadata from request headers (optional)
   */
  private getMetadataFromHeaders(request: Request): {
    exportedAt?: string;
    version?: string;
  } {
    return {
      exportedAt: request.headers.get("X-Backup-Exported-At") || undefined,
      version: request.headers.get("X-Backup-Version") || undefined,
    };
  }

  /**
   * Upload backup to R2 storage
   * Client always sends compressed data, worker stores it as-is
   */
  async upload(request: Request, username: string): Promise<Response> {
    try {
      const key = this.getBackupKey(username);
      const compressedData = await request.arrayBuffer();
      const metadata = this.getMetadataFromHeaders(request);

      const customMetadata: Record<string, string> = {};
      if (metadata.exportedAt) customMetadata.exportedAt = metadata.exportedAt;
      if (metadata.version) customMetadata.version = metadata.version;

      await this.env.BACKUPS.put(key, compressedData, {
        httpMetadata: {
          contentType: CONTENT_TYPES.GZIP,
          contentEncoding: "gzip",
        },
        customMetadata:
          Object.keys(customMetadata).length > 0 ? customMetadata : undefined,
      });

      return ResponseBuilder.success({
        success: true,
        message: "Backup uploaded successfully",
        ...(metadata.exportedAt && { exportedAt: metadata.exportedAt }),
      });
    } catch (error) {
      console.error("Upload error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to upload backup";
      return ResponseBuilder.error(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Download backup from R2 storage
   * Always returns compressed data as-is
   */
  async download(username: string): Promise<Response> {
    try {
      const key = this.getBackupKey(username);
      const object = await this.env.BACKUPS.get(key);

      if (!object) {
        return ResponseBuilder.error("Backup not found", HTTP_STATUS.NOT_FOUND);
      }

      const compressedData = await object.arrayBuffer();
      return ResponseBuilder.file(compressedData, CONTENT_TYPES.GZIP, {
        "Content-Encoding": "gzip",
        "Cache-Control": "no-cache",
      });
    } catch (error) {
      console.error("Download error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to download backup";
      return ResponseBuilder.error(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete backup from R2 storage
   */
  async delete(username: string): Promise<Response> {
    try {
      const key = this.getBackupKey(username);

      await this.env.BACKUPS.delete(key);

      return ResponseBuilder.success({
        success: true,
        message: "Backup deleted successfully",
      });
    } catch (error) {
      console.error("Delete error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete backup";
      return ResponseBuilder.error(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}


/**
 * Cloud sync service for uploading/downloading backups to Cloudflare Worker API
 */

import { STORAGE_KEY, DB_NAME, DB_VERSION, DB_STORE_NAME } from "../constants";
import { importBackup } from "./backupService";

export interface CloudSyncConfig {
  apiUrl: string;
  username: string;
  password: string;
}

interface BackupData {
  version: number;
  exportedAt: string;
  localStorage: Record<string, unknown>;
  bookFiles: Array<{
    id: string;
    data: string; // Base64 encoded
  }>;
}

interface CloudSyncResponse {
  success: boolean;
  message: string;
  exportedAt?: string;
}

/**
 * Create Basic Auth header value
 */
function createBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return `Basic ${btoa(credentials)}`;
}

interface StoredBook {
  id: string;
  data: ArrayBuffer;
}

/**
 * Open IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Get all book files from IndexedDB
 */
async function getAllBookFiles(): Promise<StoredBook[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE_NAME, "readonly");
    const store = transaction.objectStore(DB_STORE_NAME);

    const request = store.getAll();
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
    request.onsuccess = () => {
      db.close();
      resolve(request.result as StoredBook[]);
    };
  });
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Get backup data in the format expected by the API
 */
async function getBackupData(): Promise<BackupData> {
  // Get localStorage data
  const localStorageData = localStorage.getItem(STORAGE_KEY);
  const parsedLocalStorage = localStorageData
    ? JSON.parse(localStorageData)
    : {};

  // Get all book files from IndexedDB
  const bookFiles = await getAllBookFiles();

  // Convert book files to base64
  const backupBookFiles = bookFiles.map((book) => ({
    id: book.id,
    data: arrayBufferToBase64(book.data),
  }));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    localStorage: parsedLocalStorage,
    bookFiles: backupBookFiles,
  };
}

/**
 * Upload backup to cloud
 */
export async function uploadBackup(
  config: CloudSyncConfig
): Promise<CloudSyncResponse> {
  try {
    const backupData = await getBackupData();

    const response = await fetch(`${config.apiUrl}/backup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createBasicAuth(config.username, config.password),
      },
      body: JSON.stringify(backupData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || "Failed to upload backup");
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Backup uploaded successfully",
      exportedAt: result.exportedAt,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload backup to cloud",
    };
  }
}

/**
 * Download backup from cloud
 */
export async function downloadBackup(
  config: CloudSyncConfig
): Promise<CloudSyncResponse> {
  try {
    const response = await fetch(`${config.apiUrl}/backup`, {
      method: "GET",
      headers: {
        Authorization: createBasicAuth(config.username, config.password),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: "No backup found in cloud",
        };
      }

      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || "Failed to download backup");
    }

    const backupData: BackupData = await response.json();

    // Validate backup structure
    if (
      !backupData.version ||
      !backupData.localStorage ||
      !Array.isArray(backupData.bookFiles)
    ) {
      throw new Error("Invalid backup format received from cloud");
    }

    // Import the backup using existing import function
    // We need to convert it to a File-like object for importBackup
    const jsonString = JSON.stringify(backupData);
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], "cloud-backup.json", {
      type: "application/json",
    });

    const importResult = await importBackup(file);

    if (!importResult.success) {
      return {
        success: false,
        message: importResult.message,
      };
    }

    return {
      success: true,
      message: importResult.message || "Backup downloaded and restored successfully",
      exportedAt: backupData.exportedAt,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to download backup from cloud",
    };
  }
}

/**
 * Delete backup from cloud
 */
export async function deleteBackup(
  config: CloudSyncConfig
): Promise<CloudSyncResponse> {
  try {
    const response = await fetch(`${config.apiUrl}/backup`, {
      method: "DELETE",
      headers: {
        Authorization: createBasicAuth(config.username, config.password),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || "Failed to delete backup");
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Backup deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete backup from cloud",
    };
  }
}


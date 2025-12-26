/**
 * Backup and restore service for exporting/importing all app data.
 * Handles both IndexedDB (book files) and localStorage (settings, library metadata).
 */

import { DB_NAME, DB_VERSION, DB_STORE_NAME, STORAGE_KEY } from "../constants";

interface StoredBook {
  id: string;
  data: ArrayBuffer;
}

interface BackupBookFile {
  id: string;
  /** Base64 encoded book data */
  data: string;
}

interface BackupData {
  version: number;
  exportedAt: string;
  localStorage: Record<string, unknown>;
  bookFiles: BackupBookFile[];
}

export const BACKUP_VERSION = 1;

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
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
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
 * Clear and restore all book files to IndexedDB
 */
async function restoreBookFiles(books: BackupBookFile[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE_NAME, "readwrite");
    const store = transaction.objectStore(DB_STORE_NAME);

    // Clear existing data first
    const clearRequest = store.clear();
    clearRequest.onerror = () => {
      db.close();
      reject(clearRequest.error);
    };

    clearRequest.onsuccess = () => {
      // Add all books from backup
      let completed = 0;
      const total = books.length;

      if (total === 0) {
        db.close();
        resolve();
        return;
      }

      for (const book of books) {
        const storedBook: StoredBook = {
          id: book.id,
          data: base64ToArrayBuffer(book.data),
        };

        const putRequest = store.put(storedBook);
        putRequest.onerror = () => {
          db.close();
          reject(putRequest.error);
        };
        putRequest.onsuccess = () => {
          completed++;
          if (completed === total) {
            db.close();
            resolve();
          }
        };
      }
    };
  });
}

/**
 * Export all app data as a downloadable JSON file
 */
export async function exportBackup(): Promise<void> {
  // Get localStorage data
  const localStorageData = localStorage.getItem(STORAGE_KEY);
  const parsedLocalStorage = localStorageData
    ? JSON.parse(localStorageData)
    : {};

  // Get all book files from IndexedDB
  const bookFiles = await getAllBookFiles();

  // Convert book files to base64
  const backupBookFiles: BackupBookFile[] = bookFiles.map((book) => ({
    id: book.id,
    data: arrayBufferToBase64(book.data),
  }));

  // Create backup object
  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    localStorage: parsedLocalStorage,
    bookFiles: backupBookFiles,
  };

  // Convert to JSON and download
  const jsonString = JSON.stringify(backup);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `read-with-ai-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import backup data from a JSON file
 */
export async function importBackup(file: File): Promise<{
  success: boolean;
  message: string;
  booksRestored?: number;
}> {
  try {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);

    // Validate backup structure
    if (
      !backup.version ||
      !backup.localStorage ||
      !Array.isArray(backup.bookFiles)
    ) {
      return {
        success: false,
        message: "Invalid backup file format",
      };
    }

    // Check version compatibility
    if (backup.version > BACKUP_VERSION) {
      return {
        success: false,
        message: `Backup version ${backup.version} is newer than supported version ${BACKUP_VERSION}`,
      };
    }

    // Restore localStorage data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.localStorage));

    // Restore book files to IndexedDB
    await restoreBookFiles(backup.bookFiles);

    return {
      success: true,
      message: `Backup restored successfully! ${backup.bookFiles.length} book(s) restored.`,
      booksRestored: backup.bookFiles.length,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to parse backup file",
    };
  }
}

/**
 * Get backup file size estimate (useful for UI)
 */
export async function getBackupSizeEstimate(): Promise<{
  booksCount: number;
  estimatedSizeMB: number;
}> {
  const bookFiles = await getAllBookFiles();
  const totalBytes = bookFiles.reduce(
    (acc, book) => acc + book.data.byteLength,
    0
  );

  return {
    booksCount: bookFiles.length,
    // Base64 encoding increases size by ~33%, plus some overhead for JSON
    estimatedSizeMB:
      Math.round(((totalBytes * 1.33) / (1024 * 1024)) * 10) / 10,
  };
}

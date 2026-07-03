import { STORAGE_KEY } from "../constants";
import { getAllBookFiles } from "../store/bookStorage";
import { arrayBufferToBase64 } from "../utils/binary";

export const BACKUP_VERSION = 1;

export interface BackupBookFile {
  id: string;
  data: string;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  localStorage: Record<string, unknown>;
  bookFiles: BackupBookFile[];
}

export async function buildBackupPayload(): Promise<BackupData> {
  const localStorageData = localStorage.getItem(STORAGE_KEY);
  const parsedLocalStorage = localStorageData
    ? JSON.parse(localStorageData)
    : {};

  const bookFiles = await getAllBookFiles();

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    localStorage: parsedLocalStorage,
    bookFiles: bookFiles.map((book) => ({
      id: book.id,
      data: arrayBufferToBase64(book.data),
    })),
  };
}

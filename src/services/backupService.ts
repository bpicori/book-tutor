import { STORAGE_KEY } from "../constants";
import { deleteAllBooks, restoreBookFiles } from "../store/bookStorage";
import { useStore } from "../store/useStore";
import {
  BACKUP_VERSION,
  buildBackupPayload,
  type BackupData,
} from "./backupData";

export { BACKUP_VERSION } from "./backupData";

export async function exportBackup(): Promise<void> {
  const backup = await buildBackupPayload();
  const jsonString = JSON.stringify(backup);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `book-tutor-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<{
  success: boolean;
  message: string;
  booksRestored?: number;
}> {
  try {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);

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

    if (backup.version > BACKUP_VERSION) {
      return {
        success: false,
        message: `Backup version ${backup.version} is newer than supported version ${BACKUP_VERSION}`,
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.localStorage));
    await restoreBookFiles(backup.bookFiles);

    try {
      const persistData = backup.localStorage as
        | { state?: unknown; version?: number }
        | Record<string, unknown>;

      const restoredState =
        "state" in persistData && persistData.state
          ? (persistData.state as Partial<ReturnType<typeof useStore.getState>>)
          : (persistData as Partial<ReturnType<typeof useStore.getState>>);

      if (restoredState && typeof restoredState === "object") {
        const currentState = useStore.getState();
        useStore.setState({
          ...currentState,
          ...restoredState,
        } as ReturnType<typeof useStore.getState>);
      }
    } catch (error) {
      console.error("Error updating store state after restore:", error);
    }

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

export async function resetApp(): Promise<void> {
  await deleteAllBooks();
  localStorage.removeItem(STORAGE_KEY);
  await useStore.persist.clearStorage();
  window.location.assign(import.meta.env.BASE_URL);
}

export async function getBackupSizeEstimate(): Promise<{
  booksCount: number;
  estimatedSizeMB: number;
}> {
  const backup = await buildBackupPayload();
  const totalBytes = backup.bookFiles.reduce((acc, book) => {
    return acc + atob(book.data).length;
  }, 0);

  return {
    booksCount: backup.bookFiles.length,
    estimatedSizeMB:
      Math.round(((totalBytes * 1.33) / (1024 * 1024)) * 10) / 10,
  };
}

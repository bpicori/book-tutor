import { DB_NAME, DB_VERSION, DB_STORE_NAME } from "../constants";
import { base64ToArrayBuffer } from "../utils/binary";
import type { BackupBookFile } from "../services/backupData";

const STORE_NAME = DB_STORE_NAME;

export interface StoredBook {
  id: string;
  data: ArrayBuffer;
}

let dbCache: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbCache) {
    return Promise.resolve(dbCache);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbCache = request.result;
      resolve(dbCache);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export function closeDB(): void {
  if (dbCache) {
    dbCache.close();
    dbCache = null;
  }
}

export async function saveBookFile(id: string, file: File): Promise<void> {
  const db = await openDB();
  const data = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.put({ id, data } as StoredBook);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getBookFile(id: string): Promise<File | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as StoredBook | undefined;
      if (result) {
        const blob = new Blob([result.data], { type: "application/epub+zip" });
        const file = new File([blob], `${id}.epub`, {
          type: "application/epub+zip",
        });
        resolve(file);
      } else {
        resolve(null);
      }
    };
  });
}

export async function deleteBookFile(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllBookIds(): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAllKeys();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string[]);
  });
}

export async function getAllBookFiles(): Promise<StoredBook[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as StoredBook[]);
  });
}

export async function restoreBookFiles(books: BackupBookFile[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const clearRequest = store.clear();
    clearRequest.onerror = () => reject(clearRequest.error);

    clearRequest.onsuccess = () => {
      if (books.length === 0) {
        resolve();
        return;
      }

      let completed = 0;
      for (const book of books) {
        const putRequest = store.put({
          id: book.id,
          data: base64ToArrayBuffer(book.data),
        } satisfies StoredBook);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          completed++;
          if (completed === books.length) {
            resolve();
          }
        };
      }
    };
  });
}

export async function deleteAllBooks(): Promise<void> {
  closeDB();

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onerror = () =>
      reject(request.error ?? new Error("Failed to delete book storage"));

    request.onsuccess = () => resolve();

    request.onblocked = () =>
      reject(
        new Error("Reset blocked — close other Book Tutor tabs and try again")
      );
  });
}

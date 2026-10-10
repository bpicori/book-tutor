import {
  SPEECH_CACHE_AUDIO_STORE,
  SPEECH_CACHE_DB_NAME,
  SPEECH_CACHE_DB_VERSION,
  SPEECH_CACHE_MAX_BYTES,
  SPEECH_CACHE_META_STORE,
} from "../constants";

/**
 * Persistent, byte-capped store for synthesized read-aloud audio.
 *
 * Audio is kept in IndexedDB (not just in-memory blob URLs) so replaying,
 * reopening a book, or pressing prev never re-bills the speech provider. The
 * DB is separate from the book DB so its version can move independently.
 */

export interface SpeechCacheMeta {
  id: string;
  bookId: string;
  bytes: number;
  lastUsed: number;
}

let dbCache: IDBDatabase | null = null;
let persistenceRequested = false;
let trimScheduled = false;

function openDB(): Promise<IDBDatabase> {
  if (dbCache) return Promise.resolve(dbCache);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      SPEECH_CACHE_DB_NAME,
      SPEECH_CACHE_DB_VERSION
    );
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbCache = request.result;
      resolve(dbCache);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SPEECH_CACHE_META_STORE)) {
        const meta = db.createObjectStore(SPEECH_CACHE_META_STORE, {
          keyPath: "id",
        });
        meta.createIndex("by_bookId", "bookId", { unique: false });
        meta.createIndex("by_lastUsed", "lastUsed", { unique: false });
      }
      if (!db.objectStoreNames.contains(SPEECH_CACHE_AUDIO_STORE)) {
        db.createObjectStore(SPEECH_CACHE_AUDIO_STORE, { keyPath: "id" });
      }
    };
  });
}

/**
 * Stable cache id for one paragraph under one voice/model/book. `crypto.subtle`
 * is unavailable outside a secure context; fall back to the composite string.
 */
export async function speechCacheKey(
  baseUrl: string,
  model: string,
  voice: string,
  bookId: string,
  text: string
): Promise<string> {
  const input = `${baseUrl}|${model}|${voice}|${bookId}|${text}`;
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return input;
  try {
    const digest = await subtle.digest(
      "SHA-256",
      new TextEncoder().encode(input)
    );
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return input;
  }
}

export async function getSpeechBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(SPEECH_CACHE_AUDIO_STORE, "readonly")
      .objectStore(SPEECH_CACHE_AUDIO_STORE)
      .get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as { id: string; blob: Blob } | undefined;
      resolve(result?.blob ?? null);
    };
  });
}

/** Marks a record as recently used so LRU eviction keeps hot paragraphs. */
export async function touchSpeechBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SPEECH_CACHE_META_STORE, "readwrite");
    const store = transaction.objectStore(SPEECH_CACHE_META_STORE);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const meta = request.result as SpeechCacheMeta | undefined;
      if (meta) store.put({ ...meta, lastUsed: Date.now() });
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/** Writes a blob and its metadata, then schedules LRU trimming. */
export async function putSpeechBlob(
  id: string,
  bookId: string,
  blob: Blob
): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [SPEECH_CACHE_META_STORE, SPEECH_CACHE_AUDIO_STORE],
      "readwrite"
    );
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    const meta: SpeechCacheMeta = {
      id,
      bookId,
      bytes: blob.size,
      lastUsed: Date.now(),
    };
    transaction.objectStore(SPEECH_CACHE_META_STORE).put(meta);
    transaction.objectStore(SPEECH_CACHE_AUDIO_STORE).put({ id, blob });
  });
  requestPersistence();
  trimSpeechCache();
}

/** Requests durable storage once, so the browser is less likely to evict it. */
function requestPersistence(): void {
  if (persistenceRequested) return;
  persistenceRequested = true;
  try {
    void navigator.storage?.persist?.();
  } catch {
    // Persistence is best-effort.
  }
}

/** Effective cap: the constant, bounded by a quarter of the origin quota. */
async function effectiveMaxBytes(): Promise<number> {
  let max = SPEECH_CACHE_MAX_BYTES;
  try {
    const estimate = await navigator.storage?.estimate?.();
    const quota = estimate?.quota;
    if (quota && quota > 0) {
      max = Math.min(max, Math.floor(quota * 0.25));
    }
  } catch {
    // Keep the constant cap when the estimate is unavailable.
  }
  return max;
}

/** Schedules one LRU pass; concurrent calls collapse into a single run. */
export function trimSpeechCache(): void {
  if (trimScheduled) return;
  trimScheduled = true;
  void runTrim()
    .catch(() => {
      // Trimming is best-effort; a failed pass retries on the next write.
    })
    .finally(() => {
      trimScheduled = false;
    });
}

async function runTrim(): Promise<void> {
  const db = await openDB();
  const max = await effectiveMaxBytes();

  const metas = await new Promise<SpeechCacheMeta[]>((resolve, reject) => {
    const request = db
      .transaction(SPEECH_CACHE_META_STORE, "readonly")
      .objectStore(SPEECH_CACHE_META_STORE)
      .getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as SpeechCacheMeta[]);
  });

  let total = metas.reduce((sum, meta) => sum + (meta.bytes || 0), 0);
  if (total <= max) return;

  metas.sort((a, b) => a.lastUsed - b.lastUsed);
  const doomed: string[] = [];
  for (const meta of metas) {
    if (total <= max) break;
    doomed.push(meta.id);
    total -= meta.bytes || 0;
  }
  if (doomed.length === 0) return;

  await deleteRecords(db, doomed);
}

async function deleteRecords(db: IDBDatabase, ids: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [SPEECH_CACHE_META_STORE, SPEECH_CACHE_AUDIO_STORE],
      "readwrite"
    );
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    const meta = transaction.objectStore(SPEECH_CACHE_META_STORE);
    const audio = transaction.objectStore(SPEECH_CACHE_AUDIO_STORE);
    for (const id of ids) {
      meta.delete(id);
      audio.delete(id);
    }
  });
}

/** Removes every cached paragraph that belongs to one book. */
export async function removeSpeechForBook(bookId: string): Promise<void> {
  const db = await openDB();
  const ids = await new Promise<string[]>((resolve, reject) => {
    const request = db
      .transaction(SPEECH_CACHE_META_STORE, "readonly")
      .objectStore(SPEECH_CACHE_META_STORE)
      .index("by_bookId")
      .getAllKeys(IDBKeyRange.only(bookId));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string[]);
  });
  if (ids.length === 0) return;
  await deleteRecords(db, ids);
}

/** Drops the whole speech cache. */
export async function clearSpeechCache(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [SPEECH_CACHE_META_STORE, SPEECH_CACHE_AUDIO_STORE],
      "readwrite"
    );
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.objectStore(SPEECH_CACHE_META_STORE).clear();
    transaction.objectStore(SPEECH_CACHE_AUDIO_STORE).clear();
  });
}

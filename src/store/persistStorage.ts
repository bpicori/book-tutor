import type { ChapterChats } from "../types";
import { STORAGE_KEY } from "../constants";

/**
 * Quota-safe localStorage layer for the persisted store.
 *
 * The store writes on every state change, and AI chat streaming updates the
 * store once per token. Persisting a streaming conversation at that rate is
 * wasteful and can exhaust the browser quota, so the store strips in-flight
 * messages before writing and this module survives a full quota by retrying
 * with older conversations trimmed instead of silently losing state.
 */

/** Messages kept per conversation once storage runs out of room. */
const QUOTA_TRIM_MESSAGES = 6;
/** Conversations kept once storage runs out of room. */
const QUOTA_TRIM_CHAPTERS = 10;
/** Conversations read in full; older ones are trimmed on load. */
const LOAD_MAX_CHAPTERS = 50;
/** Messages preserved per conversation on load. */
const LOAD_MAX_MESSAGES = 200;

let loggedQuotaTrim = false;

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.message.toLowerCase().includes("quota")
  );
}

/** In-flight assistant messages are skipped: they are written when streaming ends. */
export function stripStreaming(chats: ChapterChats): ChapterChats {
  const next: ChapterChats = {};
  for (const [key, store] of Object.entries(chats)) {
    const messages = (store.messages ?? []).filter((m) => !m.isStreaming);
    if (messages.length === 0) continue;
    next[key] = { ...store, messages };
  }
  return next;
}

function pruneChats(
  chats: ChapterChats,
  keepMessages: number,
  keepChapters: number
): ChapterChats {
  const entries = Object.entries(chats);
  if (entries.length === 0) return chats;

  // Snapshots written before conversations carried metadata store a bare
  // message array; `migrateChapterChats` upgrades those at hydration time.
  const normalized: ChapterChats = {};
  for (const [key, store] of entries) {
    if (Array.isArray(store)) {
      normalized[key] = { messages: store, updatedAt: 0 };
    } else if (store && Array.isArray(store.messages)) {
      normalized[key] = store;
    }
  }

  const keep = new Set(
    Object.entries(normalized)
      .sort(([, a], [, b]) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, keepChapters)
      .map(([key]) => key)
  );

  const next: ChapterChats = {};
  for (const [key, store] of Object.entries(normalized)) {
    if (!keep.has(key)) continue;
    next[key] = {
      ...store,
      messages: store.messages.slice(-keepMessages),
    };
  }
  return next;
}

function warnQuotaTrim(): void {
  if (loggedQuotaTrim) return;
  loggedQuotaTrim = true;
  console.warn(
    "Browser storage is full: older AI conversations were trimmed to fit."
  );
}

/** Shape zustand persist hands to the storage layer. */
export interface PersistedEnvelope {
  state: Record<string, unknown>;
  version?: number;
}

/**
 * Writes a snapshot, retrying with older chat data trimmed when the quota is
 * exhausted. Returns the raw JSON that was stored, or null on failure.
 */
export function writeWithQuotaRecovery(
  envelope: PersistedEnvelope
): string | null {
  const attempts: Array<[number, number]> = [
    [QUOTA_TRIM_MESSAGES * 5, QUOTA_TRIM_CHAPTERS],
    [QUOTA_TRIM_MESSAGES, 3],
    [2, 1],
  ];

  try {
    const raw = JSON.stringify(envelope);
    window.localStorage.setItem(STORAGE_KEY, raw);
    return raw;
  } catch (error) {
    if (!isQuotaError(error)) {
      console.error("Failed to persist state:", error);
      return null;
    }
  }

  const chats = envelope.state.chapterChats as ChapterChats | undefined;

  for (const [keepMessages, keepChapters] of attempts) {
    const candidate: PersistedEnvelope = chats
      ? {
          ...envelope,
          state: {
            ...envelope.state,
            chapterChats: pruneChats(chats, keepMessages, keepChapters),
          },
        }
      : envelope;
    try {
      const raw = JSON.stringify(candidate);
      window.localStorage.setItem(STORAGE_KEY, raw);
      warnQuotaTrim();
      return raw;
    } catch {
      // Try the next, more aggressive trim.
    }
  }

  console.error(
    "Browser storage is full and the latest changes could not be saved."
  );
  return null;
}

/**
 * Reads the persisted envelope, trimming conversations beyond the load budget
 * so a single oversized snapshot cannot lock the app out of hydrating.
 * Returns the raw envelope JSON, or null when nothing usable is stored.
 */
export function readSnapshot(): string | null {
  if (!isStorageAvailable()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedEnvelope;
    if (!parsed || typeof parsed.state !== "object" || parsed.state === null) {
      return null;
    }

    const chats = parsed.state.chapterChats as ChapterChats | undefined;
    if (chats && Object.keys(chats).length > 0) {
      parsed.state = {
        ...parsed.state,
        chapterChats: pruneChats(chats, LOAD_MAX_MESSAGES, LOAD_MAX_CHAPTERS),
      };
    }

    return JSON.stringify(parsed);
  } catch (error) {
    console.error("Failed to read persisted state:", error);
    return null;
  }
}

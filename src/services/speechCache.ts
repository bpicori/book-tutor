import type { ReadAloudParagraph } from "../utils/ttsChunker";
import { generateSpeech, type SpeechRequestSettings } from "./speechService";
import {
  getSpeechBlob,
  putSpeechBlob,
  speechCacheKey,
  touchSpeechBlob,
} from "./speechStore";

const CACHE_LIMIT = 200;

/**
 * Session cache of synthesized paragraphs, backed by the persistent speech
 * store.
 *
 * Paragraphs are cached as blob URLs keyed by provider settings + book + text,
 * so prev/next, replays, and reopening a book never re-bill. Concurrent
 * requests for the same paragraph share one in-flight promise. On a memory
 * miss the IndexedDB store is checked before the network. `AbortController`s
 * let `stop` cancel pending work without dropping already-cached audio.
 */
export class SpeechCache {
  private readonly urls = new Map<string, string>();
  private readonly inFlight = new Map<string, Promise<string>>();
  private readonly controllers = new Set<AbortController>();

  private memoryKey(
    text: string,
    settings: SpeechRequestSettings,
    bookId: string | null
  ): string {
    return `${settings.baseUrl}|${settings.model}|${settings.voice}|${
      bookId ?? ""
    }|${text}`;
  }

  get(
    paragraph: ReadAloudParagraph,
    settings: SpeechRequestSettings,
    bookId: string | null
  ): Promise<string> {
    const key = this.memoryKey(paragraph.text, settings, bookId);
    const cached = this.urls.get(key);
    if (cached) return Promise.resolve(cached);

    // A prefetch may already be fetching the same paragraph; share it.
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const controller = new AbortController();
    this.controllers.add(controller);
    const promise = this.resolve(
      key,
      paragraph,
      settings,
      bookId,
      controller
    ).finally(() => {
      this.controllers.delete(controller);
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }

  private async resolve(
    key: string,
    paragraph: ReadAloudParagraph,
    settings: SpeechRequestSettings,
    bookId: string | null,
    controller: AbortController
  ): Promise<string> {
    const id = await speechCacheKey(
      settings.baseUrl,
      settings.model,
      settings.voice,
      bookId ?? "",
      paragraph.text
    );

    // A persisted hit never touches the network.
    const persisted = await getSpeechBlob(id);
    if (persisted) {
      const url = URL.createObjectURL(persisted);
      this.urls.set(key, url);
      this.trim();
      void touchSpeechBlob(id).catch(() => {
        // Recency updates are best-effort.
      });
      return url;
    }

    const blob = await generateSpeech(
      paragraph.text,
      settings,
      controller.signal
    );
    const url = URL.createObjectURL(blob);
    this.urls.set(key, url);
    this.trim();
    void putSpeechBlob(id, bookId ?? "", blob).catch(() => {
      // Quota or IDB failures must not break playback.
    });
    return url;
  }

  /** Fetches a paragraph ahead of playback; resolves to its URL if it lands. */
  async prefetch(
    paragraph: ReadAloudParagraph,
    settings: SpeechRequestSettings,
    bookId: string | null
  ): Promise<string | undefined> {
    try {
      return await this.get(paragraph, settings, bookId);
    } catch {
      // Prefetch failures are silent; playback retries on demand.
      return undefined;
    }
  }

  /** Cancels in-flight work but keeps cached audio for replay. */
  abortAll(): void {
    for (const controller of this.controllers) controller.abort();
    this.controllers.clear();
    this.inFlight.clear();
  }

  /** Cancels work and releases every in-memory blob URL. */
  dispose(): void {
    this.abortAll();
    for (const url of this.urls.values()) URL.revokeObjectURL(url);
    this.urls.clear();
  }

  private trim(): void {
    if (this.urls.size <= CACHE_LIMIT) return;
    const excess = this.urls.size - CACHE_LIMIT;
    let removed = 0;
    for (const [key, url] of this.urls) {
      if (removed >= excess) break;
      URL.revokeObjectURL(url);
      this.urls.delete(key);
      removed++;
    }
  }
}

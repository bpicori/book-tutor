/** A tiny silent WAV, used to unlock the audio elements inside the click. */
const SILENT_AUDIO =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

/**
 * Two reused `HTMLAudioElement`s for read-aloud.
 *
 * Two elements make playback gapless: while one speaks paragraph N, the other
 * can be preloaded with N+1, so the swap on `ended` starts instantly. Both are
 * unlocked inside the same user gesture so the browser's autoplay permission
 * covers either one. `onEnded` fires when the active paragraph finishes.
 */
export class SpeechAudio {
  private readonly elements: [HTMLAudioElement, HTMLAudioElement];
  private activeIndex = 0;
  private preloadedUrl: string | null = null;
  private readonly onEnded: () => void;
  private readonly handleEnded = (event: Event) => {
    if (event.target === this.elements[this.activeIndex]) this.onEnded();
  };

  constructor(onEnded: () => void) {
    this.onEnded = onEnded;
    this.elements = [this.createElement(), this.createElement()];
  }

  private createElement(): HTMLAudioElement {
    const audio = new Audio();
    audio.preload = "auto";
    audio.addEventListener("ended", this.handleEnded);
    return audio;
  }

  private get active(): HTMLAudioElement {
    return this.elements[this.activeIndex];
  }

  private get idle(): HTMLAudioElement {
    return this.elements[1 - this.activeIndex];
  }

  /** Unlocks autoplay on both elements, inside a user gesture. */
  unlock(): void {
    for (const audio of this.elements) this.unlockElement(audio);
  }

  private unlockElement(audio: HTMLAudioElement): void {
    if (audio.dataset.unlocked === "1") return;
    audio.dataset.unlocked = "1";
    audio.muted = true;
    audio.src = SILENT_AUDIO;
    const unlockSrc = audio.src;
    void audio
      .play()
      .then(() => {
        // Only reset if a real paragraph has not already replaced it.
        if (audio.src === unlockSrc) {
          audio.pause();
          audio.currentTime = 0;
        }
        audio.muted = false;
      })
      .catch(() => {
        delete audio.dataset.unlocked;
        audio.muted = false;
      });
  }

  /** Loads the next paragraph onto the idle element without starting it. */
  preload(url: string): void {
    const idle = this.idle;
    if (idle.src === url) return;
    idle.src = url;
    idle.currentTime = 0;
    idle.load();
    this.preloadedUrl = url;
  }

  /** Swaps to the element holding `url` and starts it. */
  async play(url: string): Promise<void> {
    const target = this.idle;
    if (!(this.preloadedUrl === url && target.src === url)) {
      target.src = url;
    }
    target.currentTime = 0;

    // Swap before playing so `ended` is attributed to the new active element.
    const previous = this.active;
    this.activeIndex = 1 - this.activeIndex;
    this.preloadedUrl = null;
    previous.pause();

    try {
      await this.active.play();
    } catch (err) {
      // Autoplay fallback: retry on the element that just stopped.
      try {
        previous.src = url;
        previous.currentTime = 0;
        await previous.play();
        this.activeIndex = 1 - this.activeIndex;
        return;
      } catch {
        throw err;
      }
    }
  }

  /** Resumes the current paragraph after a pause. */
  resume(): Promise<void> {
    return this.active.play();
  }

  pause(): void {
    this.active.pause();
  }

  stop(): void {
    for (const audio of this.elements) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    this.preloadedUrl = null;
  }

  /** Removes the `ended` listeners and clears both elements. */
  dispose(): void {
    for (const audio of this.elements) {
      audio.removeEventListener("ended", this.handleEnded);
    }
    this.stop();
  }
}

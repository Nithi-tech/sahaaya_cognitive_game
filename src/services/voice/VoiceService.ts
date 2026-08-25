import type { Language } from '../../types';
import type { VoiceProvider } from './types';
import { BrowserTTSProvider } from './BrowserTTSProvider';

export type VoiceSpeed = 'slow' | 'normal' | 'fast';
export type VoiceState = 'idle' | 'speaking' | 'paused' | 'error';

// Elderly-first default: comfortably slower than natural conversational
// speech, but not so slow it stops sounding like a sentence.
const SPEED_RATE: Record<VoiceSpeed, number> = { slow: 0.8, normal: 1, fast: 1.2 };

// If pausing doesn't actually pause within this window, this platform can't
// do it reliably — fall back to stop, and resume() replays from the start
// instead of leaving the UI stuck on a "paused" state that never continues.
const PAUSE_FALLBACK_TIMEOUT_MS = 300;

// If speech doesn't start within this window (autoplay policy blocked it,
// e.g. first speech on some mobile browsers before any user gesture), treat
// it as failed so the quiz never waits on audio that will never arrive.
const AUTOPLAY_WATCHDOG_MS = 700;

type Listener = (state: VoiceState) => void;
interface SpeakHandlers {
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * Single point of contact between every quiz component and speech. Owns the
 * current provider, voice options, and playback state so that starting new
 * speech always cancels whatever was playing first — no double-speak, no
 * overlapping questions, regardless of how many components call it.
 */
class VoiceServiceImpl {
  private provider: VoiceProvider;
  private state: VoiceState = 'idle';
  private readonly listeners = new Set<Listener>();

  private language: Language = 'en';
  private rate = SPEED_RATE.slow;
  private pitch = 1;
  private volume = 1;

  private lastText: string | null = null;
  private lastHandlers: SpeakHandlers = {};
  private pauseFallbackActive = false;
  private startWatchdog: ReturnType<typeof setTimeout> | null = null;

  constructor(provider: VoiceProvider = new BrowserTTSProvider()) {
    this.provider = provider;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.stop();
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.stop());
    }
  }

  /** Swap in a production provider (Bhashini, AI4Bharat, native) without touching call sites. */
  setProvider(provider: VoiceProvider): void {
    this.provider.cancel();
    this.provider = provider;
  }

  isSupported(): boolean {
    return this.provider.isSupported();
  }

  setLanguage(lang: Language): void {
    this.language = lang;
  }

  setSpeed(speed: VoiceSpeed): void {
    this.rate = SPEED_RATE[speed];
  }

  setRate(rate: number): void {
    this.rate = rate;
  }

  setPitch(pitch: number): void {
    this.pitch = pitch;
  }

  setVolume(volume: number): void {
    this.volume = volume;
  }

  getState(): VoiceState {
    return this.state;
  }

  isSpeaking(): boolean {
    return this.state === 'speaking';
  }

  isPaused(): boolean {
    return this.state === 'paused';
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(next: VoiceState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener(next));
  }

  speak(text: string, handlers: SpeakHandlers = {}): void {
    this.clearWatchdog();
    this.provider.cancel();
    this.pauseFallbackActive = false;

    if (!text.trim()) {
      this.setState('idle');
      return;
    }
    if (!this.provider.isSupported()) {
      this.setState('error');
      handlers.onError?.('unsupported');
      return;
    }

    this.lastText = text;
    this.lastHandlers = handlers;
    let started = false;

    this.startWatchdog = setTimeout(() => {
      if (started) return;
      this.provider.cancel();
      this.setState('error');
      handlers.onError?.('autoplay-blocked');
    }, AUTOPLAY_WATCHDOG_MS);

    this.provider.speak(
      text,
      { lang: this.language, rate: this.rate, pitch: this.pitch, volume: this.volume },
      {
        onStart: () => {
          started = true;
          this.clearWatchdog();
          this.setState('speaking');
        },
        onEnd: () => {
          this.clearWatchdog();
          this.setState('idle');
          handlers.onEnd?.();
        },
        onError: (error) => {
          this.clearWatchdog();
          this.setState('error');
          handlers.onError?.(error);
        },
      },
    );
  }

  /** Replays the last question/text as many times as the user wants — never penalized. */
  replay(): void {
    if (this.lastText) this.speak(this.lastText, this.lastHandlers);
  }

  pause(): void {
    if (this.state !== 'speaking') return;
    this.provider.pause();
    this.setState('paused');
    setTimeout(() => {
      if (this.state === 'paused' && !this.provider.isPaused()) {
        this.pauseFallbackActive = true;
        this.provider.cancel();
      }
    }, PAUSE_FALLBACK_TIMEOUT_MS);
  }

  resume(): void {
    if (this.state !== 'paused') return;
    if (this.pauseFallbackActive) {
      this.pauseFallbackActive = false;
      this.replay();
    } else {
      this.provider.resume();
      this.setState('speaking');
    }
  }

  /** Stops speech without affecting quiz progress — the quiz never depends on audio finishing. */
  stop(): void {
    this.clearWatchdog();
    this.provider.cancel();
    this.pauseFallbackActive = false;
    this.setState('idle');
  }

  private clearWatchdog(): void {
    if (this.startWatchdog) {
      clearTimeout(this.startWatchdog);
      this.startWatchdog = null;
    }
  }
}

export { VoiceServiceImpl };
export const voiceService = new VoiceServiceImpl();

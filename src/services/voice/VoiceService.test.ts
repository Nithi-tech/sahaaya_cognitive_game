import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceServiceImpl } from './VoiceService';
import type { VoiceProvider, SpeakOptions, SpeakHandlers } from './types';

/** Controllable stand-in for BrowserTTSProvider so tests never touch real speech APIs. */
class FakeProvider implements VoiceProvider {
  readonly name = 'fake';
  supported = true;
  pausable = true;
  speaking = false;
  paused = false;
  lastText: string | null = null;
  lastOptions: SpeakOptions | null = null;
  private handlers: SpeakHandlers | null = null;
  cancelCalls = 0;

  isSupported(): boolean {
    return this.supported;
  }

  speak(text: string, options: SpeakOptions, handlers: SpeakHandlers): void {
    this.lastText = text;
    this.lastOptions = options;
    this.handlers = handlers;
    this.speaking = false;
    this.paused = false;
  }

  /** Simulates the browser firing utterance.onstart. */
  fireStart(): void {
    this.speaking = true;
    this.handlers?.onStart?.();
  }

  fireEnd(): void {
    this.speaking = false;
    this.handlers?.onEnd?.();
  }

  fireError(error: string): void {
    this.speaking = false;
    this.handlers?.onError?.(error);
  }

  pause(): void {
    if (this.pausable) {
      this.paused = true;
      this.speaking = false;
    }
    // Non-pausable platforms silently ignore pause(), as some mobile browsers do.
  }

  resume(): void {
    this.paused = false;
    this.speaking = true;
  }

  cancel(): void {
    this.cancelCalls++;
    this.speaking = false;
    this.paused = false;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  isPaused(): boolean {
    return this.paused;
  }
}

describe('VoiceService', () => {
  let provider: FakeProvider;
  let service: VoiceServiceImpl;

  beforeEach(() => {
    vi.useFakeTimers();
    provider = new FakeProvider();
    service = new VoiceServiceImpl(provider);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the current state to subscribers as speech starts and ends', () => {
    const states: string[] = [];
    service.subscribe((s) => states.push(s));

    service.speak('Hello');
    provider.fireStart();
    expect(service.isSpeaking()).toBe(true);

    provider.fireEnd();
    expect(service.getState()).toBe('idle');
    expect(states).toEqual(['speaking', 'idle']);
  });

  it('never double-speaks: starting a new question cancels the previous one', () => {
    service.speak('Question A');
    provider.fireStart();
    expect(provider.lastText).toBe('Question A');

    service.speak('Question B');
    // cancel() was called before the new utterance was handed to the provider
    expect(provider.cancelCalls).toBeGreaterThanOrEqual(1);
    expect(provider.lastText).toBe('Question B');
  });

  it('replay() repeats the last spoken text', () => {
    service.speak('What comes next?');
    provider.fireStart();
    provider.fireEnd();

    service.replay();
    expect(provider.lastText).toBe('What comes next?');
  });

  it('surfaces "unsupported" as an error instead of throwing when speech is unavailable', () => {
    provider.supported = false;
    const onError = vi.fn();
    service.speak('Hello', { onError });
    expect(onError).toHaveBeenCalledWith('unsupported');
    expect(service.getState()).toBe('error');
  });

  it('treats speech that never starts as autoplay-blocked and recovers into an error state', () => {
    const onError = vi.fn();
    service.speak('Hello', { onError });
    // Never call provider.fireStart() — simulates a platform silently blocking speech.
    vi.advanceTimersByTime(800);
    expect(onError).toHaveBeenCalledWith('autoplay-blocked');
    expect(service.getState()).toBe('error');
  });

  it('pauses and resumes normally when the platform supports it', () => {
    service.speak('Hello');
    provider.fireStart();

    service.pause();
    expect(service.isPaused()).toBe(true);
    vi.advanceTimersByTime(500);
    expect(service.isPaused()).toBe(true);

    service.resume();
    expect(service.isSpeaking()).toBe(true);
    expect(provider.lastText).toBe('Hello'); // resumed, not replayed
  });

  it('falls back to stop+replay when the platform cannot really pause', () => {
    provider.pausable = false;
    service.speak('Hello there');
    provider.fireStart();

    service.pause();
    expect(service.isPaused()).toBe(true); // UI shows Paused immediately, no flicker
    vi.advanceTimersByTime(500); // fallback watchdog fires
    expect(provider.cancelCalls).toBeGreaterThanOrEqual(1);

    service.resume();
    // Fallback resume replays from the beginning rather than leaving a dead "paused" state.
    expect(provider.lastText).toBe('Hello there');
  });

  it('stop() halts speech but never throws or affects unrelated state', () => {
    service.speak('Hello');
    provider.fireStart();
    service.stop();
    expect(service.getState()).toBe('idle');
    expect(provider.cancelCalls).toBeGreaterThanOrEqual(1);
  });
});

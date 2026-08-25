import type { VoiceProvider, SpeakOptions, SpeakHandlers } from './types';

// Web Speech API BCP-47 codes. Kept private to this provider — every other
// layer of the app talks in the app's own 'en' | 'as' Language type.
const LANG_CODES: Record<string, string> = { en: 'en-IN', as: 'as-IN' };

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Thin adapter over window.speechSynthesis. First of possibly several VoiceProviders. */
export class BrowserTTSProvider implements VoiceProvider {
  readonly name = 'browser';

  isSupported(): boolean {
    return isSupported();
  }

  speak(text: string, options: SpeakOptions, handlers: SpeakHandlers): void {
    if (!isSupported()) {
      handlers.onError?.('unsupported');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[options.lang] ?? options.lang;
    utterance.rate = options.rate;
    utterance.pitch = options.pitch;
    utterance.volume = options.volume;
    utterance.onstart = () => handlers.onStart?.();
    utterance.onend = () => handlers.onEnd?.();
    utterance.onerror = (event) => handlers.onError?.(event.error || 'speech-error');
    utterance.onpause = () => handlers.onPause?.();
    utterance.onresume = () => handlers.onResume?.();
    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (isSupported()) window.speechSynthesis.pause();
  }

  resume(): void {
    if (isSupported()) window.speechSynthesis.resume();
  }

  cancel(): void {
    if (isSupported()) window.speechSynthesis.cancel();
  }

  isSpeaking(): boolean {
    return isSupported() && window.speechSynthesis.speaking;
  }

  isPaused(): boolean {
    return isSupported() && window.speechSynthesis.paused;
  }
}

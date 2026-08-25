import type { Language } from '../../types';

export interface SpeakOptions {
  lang: Language;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeakHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onPause?: () => void;
  onResume?: () => void;
}

/**
 * Anything that can turn text into audible speech. BrowserTTSProvider is the
 * only implementation today; Bhashini/AI4Bharat/native providers plug in
 * later behind this same interface without touching VoiceService or any quiz.
 */
export interface VoiceProvider {
  readonly name: string;
  isSupported(): boolean;
  speak(text: string, options: SpeakOptions, handlers: SpeakHandlers): void;
  pause(): void;
  resume(): void;
  cancel(): void;
  isSpeaking(): boolean;
  isPaused(): boolean;
}

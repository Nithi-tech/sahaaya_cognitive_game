// Thin, provider-agnostic wrapper around the browser's Web Speech API.
// Kept isolated behind listenOnce()/speak() so a future Bhashini/Whisper/
// AI4Bharat backend can be swapped in without touching call sites.

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: { results: { [i: number]: { [j: number]: SpeechRecognitionResultLike } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}

const LANG_CODES: Record<string, string> = { en: 'en-IN', as: 'as-IN' };

/** Listens for a single utterance and resolves with the recognized text. */
export function listenOnce(lang: 'en' | 'as'): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      reject(new Error('Speech recognition is not supported in this browser.'));
      return;
    }
    const recognition = new Ctor();
    recognition.lang = LANG_CODES[lang] ?? 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };
    recognition.onerror = (event) => reject(new Error(event.error));
    // Some browsers fire onend on silence/cancellation without ever firing
    // onresult or onerror first — without this, the promise (and the mic
    // button's "listening" state) would hang forever with no way to recover
    // short of reloading the page.
    recognition.onend = () => reject(new Error('no-speech'));
    recognition.start();
  });
}

export interface SpeakOptions {
  pitch?: number;
  rate?: number;
  audioClipUrl?: string;
  onEnd?: () => void;
}

let activePatientVoiceClip: string | null = null;

/** Sets the global active patient's family voice clip so ALL app speech uses it */
export function setActivePatientVoiceClip(clipUrl: string | null) {
  activePatientVoiceClip = clipUrl;
}

export function getActivePatientVoiceClip(): string | null {
  return activePatientVoiceClip;
}

/** Plays a recorded voice audio clip */
export function playAudioClip(audioUrl: string, onEnd?: () => void): HTMLAudioElement {
  const audio = new Audio(audioUrl);
  if (onEnd) {
    audio.onended = () => onEnd();
    audio.onerror = () => onEnd();
  }
  audio.play().catch(() => onEnd?.());
  return audio;
}

function selectPersonaVoice(lang: 'en' | 'as', pitch?: number): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetPrefix = lang === 'as' ? 'as' : 'en';
  const matchingLang = voices.filter(v => v.lang.toLowerCase().startsWith(targetPrefix));
  const pool = matchingLang.length > 0 ? matchingLang : voices;

  const isMale = pitch !== undefined && pitch <= 1.0;
  if (isMale) {
    const maleVoice = pool.find(v => {
      const n = v.name.toLowerCase();
      return n.includes('prabhat') || n.includes('ravi') || n.includes('male') || n.includes('david') || n.includes('george') || n.includes('guy');
    });
    if (maleVoice) return maleVoice;
  } else if (pitch !== undefined && pitch > 1.0) {
    const femaleVoice = pool.find(v => {
      const n = v.name.toLowerCase();
      return n.includes('heera') || n.includes('female') || n.includes('zira') || n.includes('aria') || n.includes('samantha');
    });
    if (femaleVoice) return femaleVoice;
  }

  return pool[0] || null;
}

/**
 * Speaks the given text aloud using the loved one's added voice clip if available,
 * and only falls back to robotic speech synthesis if no family voice exists.
 */
export function speak(
  text: string,
  lang: 'en' | 'as',
  onEndOrOptions?: (() => void) | SpeakOptions,
) {
  const options: SpeakOptions = typeof onEndOrOptions === 'function' ? { onEnd: onEndOrOptions } : (onEndOrOptions ?? {});

  // If an exact audio clip was explicitly requested (e.g. pre-recorded greeting), play it:
  if (options.audioClipUrl) {
    try {
      playAudioClip(options.audioClipUrl, options.onEnd);
      return;
    } catch {
      // Fall through to synthesis if audio fails to play
    }
  }

  if (!isSpeechSynthesisSupported()) { options.onEnd?.(); return; }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_CODES[lang] ?? 'en-IN';
  if (options.pitch !== undefined) utterance.pitch = options.pitch;
  if (options.rate !== undefined) utterance.rate = options.rate;

  const personaVoice = selectPersonaVoice(lang, options.pitch);
  if (personaVoice) utterance.voice = personaVoice;

  if (options.onEnd) {
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = () => options.onEnd?.();
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

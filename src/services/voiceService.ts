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

/** Speaks the given text aloud, if the browser supports speech synthesis. */
export function speak(text: string, lang: 'en' | 'as', onEnd?: () => void) {
  if (!isSpeechSynthesisSupported()) { onEnd?.(); return; }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_CODES[lang] ?? 'en-IN';
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

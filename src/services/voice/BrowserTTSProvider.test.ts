import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserTTSProvider } from './BrowserTTSProvider';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onpause: (() => void) | null = null;
  onresume: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

function installFakeSpeechSynthesis() {
  const spoken: FakeUtterance[] = [];
  const synth = {
    speaking: false,
    paused: false,
    speak: vi.fn((utterance: FakeUtterance) => {
      spoken.push(utterance);
      synth.speaking = true;
    }),
    pause: vi.fn(() => {
      synth.paused = true;
    }),
    resume: vi.fn(() => {
      synth.paused = false;
    }),
    cancel: vi.fn(() => {
      synth.speaking = false;
      synth.paused = false;
    }),
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return { synth, spoken };
}

describe('BrowserTTSProvider', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports unsupported when the browser has no speechSynthesis', () => {
    // jsdom doesn't implement speechSynthesis by default — nothing to stub here.
    const provider = new BrowserTTSProvider();
    expect(provider.isSupported()).toBe(false);

    const onError = vi.fn();
    provider.speak('Hello', { lang: 'en', rate: 1, pitch: 1, volume: 1 }, { onError });
    expect(onError).toHaveBeenCalledWith('unsupported');
  });

  it('maps the app language to the correct BCP-47 speech code', () => {
    const { spoken } = installFakeSpeechSynthesis();
    const provider = new BrowserTTSProvider();

    provider.speak('আপুনি কেমন আছেন', { lang: 'as', rate: 0.8, pitch: 1, volume: 1 }, {});
    expect(spoken[0].lang).toBe('as-IN');

    provider.speak('Hello', { lang: 'en', rate: 1, pitch: 1, volume: 1 }, {});
    expect(spoken[1].lang).toBe('en-IN');
  });

  it('forwards start/end/error callbacks from the underlying utterance', () => {
    installFakeSpeechSynthesis();
    const provider = new BrowserTTSProvider();
    const onStart = vi.fn();
    const onEnd = vi.fn();

    provider.speak('Hello', { lang: 'en', rate: 1, pitch: 1, volume: 1 }, { onStart, onEnd });
    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock.calls[0][0] as FakeUtterance;

    utterance.onstart?.();
    expect(onStart).toHaveBeenCalledTimes(1);

    utterance.onend?.();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('delegates pause/resume/cancel to the browser API', () => {
    const { synth } = installFakeSpeechSynthesis();
    const provider = new BrowserTTSProvider();

    provider.pause();
    expect(synth.pause).toHaveBeenCalledTimes(1);
    provider.resume();
    expect(synth.resume).toHaveBeenCalledTimes(1);
    provider.cancel();
    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });
});

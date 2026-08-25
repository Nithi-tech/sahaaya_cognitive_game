// Gentle, synthesized audio feedback — no external sound files needed, so it
// works fully offline. Tones are deliberately soft (never harsh/alarm-like)
// per the product's "never shame the user" rule.

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

function playTone(frequencies: number[], durationMs: number, volume = 0.08) {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const step = durationMs / 1000 / frequencies.length;

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * step;
    const end = start + step;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + step * 0.15);
    gain.gain.linearRampToValueAtTime(0, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end);
  });
}

/** A warm, rising two-note chime for a job well done. */
export function playSuccessChime() {
  playTone([523.25, 659.25, 783.99], 500); // C5, E5, G5
}

/** A soft, single-note tone for "let's try again" — never a harsh buzzer. */
export function playGentleTone() {
  playTone([392.0], 300, 0.06); // G4
}

export function playFeedbackForAccuracy(accuracy: number) {
  if (accuracy >= 70) playSuccessChime();
  else playGentleTone();
}

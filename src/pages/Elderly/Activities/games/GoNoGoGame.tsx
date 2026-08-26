import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateGoNoGo } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// Go/No-Go: tap for green, hold back for red. This is the classic clinical
// impulse-control paradigm — which is exactly why it's framed here as
// "Gentle Focus" rather than anything clinical-sounding, and why the pacing
// is slow and forgiving rather than a rapid-fire reflex test.
const TRIAL_COUNT: Record<Difficulty, number> = { easy: 8, medium: 10, challenging: 12 };
const WINDOW_MS: Record<Difficulty, number> = { easy: 2200, medium: 1800, challenging: 1400 };
const GO_RATIO = 0.75;

type StimulusKind = 'go' | 'no-go';

function buildTrials(count: number): StimulusKind[] {
  const goCount = Math.round(count * GO_RATIO);
  const trials: StimulusKind[] = [
    ...Array.from({ length: goCount }, () => 'go' as const),
    ...Array.from({ length: count - goCount }, () => 'no-go' as const),
  ];
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

export default function GoNoGoGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const [trials] = useState(() => buildTrials(TRIAL_COUNT[difficulty]));
  const [idx, setIdx] = useState(0);
  const [showing, setShowing] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | null>(null);
  const [startTime] = useState(Date.now());

  const respondedRef = useRef(false);
  const correctRef = useRef(0);
  const mistakesRef = useRef(0);
  const windowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const windowMs = WINDOW_MS[difficulty];

  useEffect(() => {
    if (idx >= trials.length) return;
    respondedRef.current = false;
    setFeedback(null);
    setShowing(true);

    windowTimer.current = setTimeout(() => {
      setShowing(false);
      // Window closed with no tap: correct for no-go, a miss for go.
      if (!respondedRef.current) {
        if (trials[idx] === 'no-go') correctRef.current += 1;
        else mistakesRef.current += 1;
      }
      gapTimer.current = setTimeout(() => {
        if (idx < trials.length - 1) {
          setIdx((p) => p + 1);
        } else {
          const accuracy = Math.round((correctRef.current / trials.length) * 100);
          onComplete(accuracy, mistakesRef.current, (Date.now() - startTime) / 1000);
        }
      }, 500);
    }, windowMs);

    return () => {
      if (windowTimer.current) clearTimeout(windowTimer.current);
      if (gapTimer.current) clearTimeout(gapTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const handleTap = () => {
    if (!showing || respondedRef.current) return;
    respondedRef.current = true;
    const isGo = trials[idx] === 'go';
    if (isGo) { correctRef.current += 1; setFeedback('correct'); }
    else { mistakesRef.current += 1; setFeedback('miss'); }
  };

  const current = trials[idx];

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {idx + 1} of {trials.length}
      </p>

      <QuestionNarrator text={narrateGoNoGo(lang)} speakKey="go-no-go-instruction">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Tap green. Wait on red.</h2>
      </QuestionNarrator>

      <div
        onClick={handleTap}
        style={{
          width: 180, height: 180, borderRadius: '50%', margin: '0 auto 24px',
          cursor: showing ? 'pointer' : 'default',
          background: !showing ? '#E2E8F0' : current === 'go' ? 'var(--color-success)' : 'var(--color-danger)',
          transition: 'background 0.1s',
          boxShadow: showing ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
        }}
      />

      {feedback === 'correct' && (
        <p style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: 15 }}>✓ Nice!</p>
      )}
      {feedback === 'miss' && (
        <p style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 15 }}>Good try — take your time.</p>
      )}
      {!feedback && !showing && idx > 0 && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Get ready…</p>
      )}
    </div>
  );
}

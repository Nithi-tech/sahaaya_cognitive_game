import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateQuickResponse } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// Classic "wait for the signal, tap fast" reaction-time task. Unlike the
// reference implementation (which classifies raw speed into tiers like
// "godlike"/"slow"), we never expose a speed judgement to the user — the
// spoken/visual feedback is always warm regardless of the number, and a
// false start (tapping early) is a gentle retry, not a failure.
const ROUNDS = 5;
const MIN_WAIT: Record<Difficulty, number> = { easy: 2200, medium: 1800, challenging: 1400 };
const MAX_WAIT: Record<Difficulty, number> = { easy: 4500, medium: 4000, challenging: 3500 };

type Phase = 'ready' | 'waiting' | 'go' | 'too-soon' | 'done';

function scoreFromMs(avgMs: number): number {
  // 400ms → 100, 1000ms → ~40, floor at 30. Generous curve for older adults.
  return Math.max(30, Math.min(100, Math.round(100 - (avgMs - 400) / 10)));
}

export default function QuickResponseGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [times, setTimes] = useState<number[]>([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [startTime] = useState(Date.now());
  const goAtRef = useRef(0);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (waitTimer.current) clearTimeout(waitTimer.current);
  }, []);

  const beginRound = () => {
    setPhase('waiting');
    const wait = MIN_WAIT[difficulty] + Math.random() * (MAX_WAIT[difficulty] - MIN_WAIT[difficulty]);
    waitTimer.current = setTimeout(() => {
      goAtRef.current = Date.now();
      setPhase('go');
    }, wait);
  };

  const handleTap = () => {
    if (phase === 'waiting') {
      // False start — tapped before the signal. No penalty beyond a gentle retry.
      if (waitTimer.current) clearTimeout(waitTimer.current);
      setFalseStarts((p) => p + 1);
      setPhase('too-soon');
      return;
    }
    if (phase !== 'go') return;
    const rt = Date.now() - goAtRef.current;
    const nextTimes = [...times, rt];
    setTimes(nextTimes);
    if (round < ROUNDS - 1) {
      setRound((p) => p + 1);
      setPhase('ready');
    } else {
      const avg = nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length;
      onComplete(scoreFromMs(avg), falseStarts, (Date.now() - startTime) / 1000);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Round {round + 1} of {ROUNDS}
      </p>

      <QuestionNarrator text={narrateQuickResponse(lang)} speakKey="quick-response-instruction">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Wait for green, then tap</h2>
      </QuestionNarrator>

      <button
        onClick={phase === 'ready' ? beginRound : handleTap}
        style={{
          width: '100%', minHeight: 220, borderRadius: 24, border: 'none',
          cursor: 'pointer',
          background:
            phase === 'go' ? 'var(--color-success)' :
            phase === 'too-soon' ? 'var(--color-warning)' :
            phase === 'waiting' ? '#C62828' :
            'var(--color-primary)',
          color: 'white', fontSize: 22, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
      >
        {phase === 'ready' && 'Tap to Start'}
        {phase === 'waiting' && 'Wait…'}
        {phase === 'go' && '👉 TAP NOW!'}
        {phase === 'too-soon' && 'Good try — a little too soon'}
      </button>

      {phase === 'too-soon' && (
        <button
          className="btn btn--primary"
          onClick={() => setPhase('ready')}
          style={{ width: '100%', height: 56, fontSize: 17, borderRadius: 16, marginTop: 16 }}
        >
          Try This Round Again
        </button>
      )}

      {times.length > 0 && (
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-tertiary)' }}>
          Completed: {times.length} of {ROUNDS}
        </p>
      )}
    </div>
  );
}

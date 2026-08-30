import { useEffect, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateFindTheChange, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// Change detection: look at a set of familiar objects, then spot which one
// changed. Culturally-personalizable by design (the object pool below is
// the Assam pilot set); no hard timer on the compare phase — the "look"
// phase is timed, but once it's over the user can take as long as they need
// to point at the object that's different.
const POOL = ['🍵', '🥭', '🎋', '🌸', '🍚', '🐘', '🍌', '🌿', '🐟', '🏺', '🪔', '☂️', '🥥', '🪷'];
const ITEM_COUNT: Record<Difficulty, number> = { easy: 5, medium: 6, challenging: 8 };
const LOOK_SECONDS: Record<Difficulty, number> = { easy: 5, medium: 4, challenging: 3 };

function pickItems(count: number): string[] {
  const shuffled = [...POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type Phase = 'look' | 'compare' | 'feedback';

export default function FindTheChangeGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const [original] = useState(() => pickItems(ITEM_COUNT[difficulty]));
  const [changedIdx] = useState(() => Math.floor(Math.random() * original.length));
  const [replacement] = useState(() => {
    const remaining = POOL.filter((e) => !original.includes(e));
    return remaining[Math.floor(Math.random() * remaining.length)];
  });
  const [phase, setPhase] = useState<Phase>('look');
  const [timeLeft, setTimeLeft] = useState(LOOK_SECONDS[difficulty]);
  const [picked, setPicked] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  const afterScene = original.map((e, i) => (i === changedIdx ? replacement : e));

  useEffect(() => {
    if (phase !== 'look') return;
    if (timeLeft <= 0) { setPhase('compare'); return; }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handlePick = (i: number) => {
    if (phase !== 'compare') return;
    setPicked(i);
    setPhase('feedback');
    const isCorrect = i === changedIdx;
    voice.speakFeedback(narrateFeedback(lang, isCorrect));
    setTimeout(() => onComplete(isCorrect ? 100 : 0, isCorrect ? 0 : 1, (Date.now() - startTime) / 1000), 1500);
  };

  if (phase === 'look') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>
          Remember these objects
        </div>
        <div style={{
          background: 'var(--color-primary)', color: 'white', borderRadius: 99,
          display: 'inline-block', padding: '6px 20px', fontSize: 28, fontWeight: 800,
          marginBottom: 24, minWidth: 56,
        }}>
          {timeLeft}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(original.length, 4)}, 1fr)`, gap: 10 }}>
          {original.map((emoji, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 16, padding: '18px 8px',
              border: '2px solid var(--border-color)', fontSize: 36,
            }}>
              {emoji}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <QuestionNarrator text={narrateFindTheChange(lang)} speakKey="find-the-change-instruction">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>What changed?</h2>
      </QuestionNarrator>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(afterScene.length, 4)}, 1fr)`, gap: 10 }}>
        {afterScene.map((emoji, i) => {
          let border = 'var(--border-color)', bg = 'white';
          if (phase === 'feedback') {
            if (i === changedIdx) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; }
            else if (i === picked) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; }
          }
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={phase === 'feedback'}
              style={{
                background: bg, border: `3px solid ${border}`, borderRadius: 16,
                padding: '18px 8px', fontSize: 36, cursor: phase === 'compare' ? 'pointer' : 'default',
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {phase === 'feedback' && (
        <div style={{
          marginTop: 20,
          background: picked === changedIdx ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          borderRadius: 12, padding: '12px 16px',
          color: picked === changedIdx ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontWeight: 600, fontSize: 16,
        }}>
          {picked === changedIdx ? '✓ Well spotted!' : 'Good try — that one changed.'}
        </div>
      )}
    </div>
  );
}

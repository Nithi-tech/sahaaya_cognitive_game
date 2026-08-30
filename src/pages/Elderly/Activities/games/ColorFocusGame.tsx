import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateColorFocus, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// A classic Stroop task: name the ink color, ignore the printed word. Kept
// deliberately gentler than a lab version — no hard per-trial time limit
// (the reference implementation fails a trial after 3s; that reads as
// punitive for an elderly audience) and a forgiving congruent ratio at
// easy difficulty.
const COLORS = [
  { name: 'Red', hex: '#E53935' },
  { name: 'Blue', hex: '#1E88E5' },
  { name: 'Green', hex: '#43A047' },
  { name: 'Yellow', hex: '#F9A825' },
];

const TRIAL_COUNT: Record<Difficulty, number> = { easy: 4, medium: 6, challenging: 8 };
const CONGRUENT_RATIO: Record<Difficulty, number> = { easy: 0.7, medium: 0.5, challenging: 0.25 };

interface Trial {
  word: string;
  inkHex: string;
  correctName: string;
}

function buildTrials(difficulty: Difficulty): Trial[] {
  const count = TRIAL_COUNT[difficulty];
  const congruentRatio = CONGRUENT_RATIO[difficulty];
  return Array.from({ length: count }, () => {
    const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const congruent = Math.random() < congruentRatio;
    const inkColor = congruent ? wordColor : COLORS.filter((c) => c.name !== wordColor.name)[Math.floor(Math.random() * (COLORS.length - 1))];
    return { word: wordColor.name, inkHex: inkColor.hex, correctName: inkColor.name };
  });
}

export default function ColorFocusGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const [trials] = useState(() => buildTrials(difficulty));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const trial = trials[idx];

  const handlePick = (colorName: string) => {
    if (answered) return;
    const isCorrect = colorName === trial.correctName;
    setSelected(colorName);
    setAnswered(true);
    if (isCorrect) setCorrectCount((p) => p + 1);
    else setMistakes((p) => p + 1);
    voice.speakFeedback(narrateFeedback(lang, isCorrect));

    advanceTimer.current = setTimeout(() => {
      if (idx < trials.length - 1) {
        setIdx((p) => p + 1);
        setSelected(null);
        setAnswered(false);
      } else {
        const accuracy = Math.round((correctCount + (isCorrect ? 1 : 0)) / trials.length * 100);
        onComplete(accuracy, mistakes + (isCorrect ? 0 : 1), (Date.now() - startTime) / 1000);
      }
    }, 900);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Question {idx + 1} of {trials.length}
      </p>

      <QuestionNarrator text={narrateColorFocus(lang)} speakKey="color-focus-instruction">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>What color is the ink?</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Not the word — the color it's printed in</p>

        <div style={{
          background: 'var(--bg-surface-tint)', borderRadius: 20, padding: '32px 20px', marginBottom: 28,
          border: '2px solid var(--border-color)',
        }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: trial.inkHex }}>{trial.word}</span>
        </div>
      </QuestionNarrator>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {COLORS.map((c) => {
          let border = 'var(--border-color)', bg = 'white';
          if (answered) {
            if (c.name === trial.correctName) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; }
            else if (c.name === selected) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; }
          }
          return (
            <button
              key={c.name}
              onClick={() => handlePick(c.name)}
              disabled={answered}
              style={{
                background: bg, border: `3px solid ${border}`, borderRadius: 16,
                padding: '18px 12px', display: 'flex', alignItems: 'center', gap: 10,
                cursor: answered ? 'default' : 'pointer', minHeight: 64,
              }}
            >
              <span style={{ width: 28, height: 28, borderRadius: 8, background: c.hex, flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{
          background: selected === trial.correctName ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          borderRadius: 12, padding: '12px 16px',
          color: selected === trial.correctName ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontWeight: 600, fontSize: 16,
        }}>
          {selected === trial.correctName ? '✓ Well done!' : `Good try — it was ${trial.correctName}.`}
        </div>
      )}
    </div>
  );
}

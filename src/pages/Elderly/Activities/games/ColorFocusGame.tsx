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
      {/* Progress Bar & Counter Pill */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#F1F5F9',
          padding: '4px 14px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          color: '#475569',
          marginBottom: 10,
        }}>
          <span>Question {idx + 1} of {trials.length}</span>
        </div>
        <div style={{
          width: '100%',
          height: 6,
          background: '#E2E8F0',
          borderRadius: 999,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${((idx + (answered ? 1 : 0)) / trials.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0284C7 0%, #10B981 100%)',
            borderRadius: 999,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <QuestionNarrator text={narrateColorFocus(lang)} speakKey="color-focus-instruction">
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          What color is the ink?
        </h2>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 22, fontWeight: 600 }}>
          💡 Ignore the word — look only at the ink color!
        </p>

        {/* Word Card */}
        <div style={{
          background: 'radial-gradient(circle at 50% 50%, #FFFFFF 0%, #F8FAFC 100%)',
          borderRadius: 26,
          padding: '30px 20px',
          marginBottom: 26,
          border: '3px solid #E2E8F0',
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
        }}>
          <span style={{
            fontSize: 54,
            fontWeight: 900,
            color: trial.inkHex,
            letterSpacing: '0.02em',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
          }}>
            {trial.word}
          </span>
        </div>
      </QuestionNarrator>

      {/* Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {COLORS.map((c) => {
          let border = '#CBD5E1', bg = '#FFFFFF', shadow = '0 4px 10px rgba(0,0,0,0.04)', textColor = '#1E293B';
          if (answered) {
            if (c.name === trial.correctName) {
              bg = '#DCFCE7';
              border = '#16A34A';
              textColor = '#15803D';
              shadow = '0 4px 14px rgba(22, 163, 74, 0.25)';
            } else if (c.name === selected) {
              bg = '#FEE2E2';
              border = '#DC2626';
              textColor = '#B91C1C';
            }
          }
          return (
            <button
              key={c.name}
              onClick={() => handlePick(c.name)}
              disabled={answered}
              style={{
                background: bg,
                border: `3px solid ${border}`,
                borderRadius: 20,
                padding: '18px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                cursor: answered ? 'default' : 'pointer',
                minHeight: 68,
                boxShadow: shadow,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: c.hex,
                flexShrink: 0,
                border: '2px solid rgba(0,0,0,0.15)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: textColor }}>{c.name}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{
          background: selected === trial.correctName ? '#DCFCE7' : '#FEF3C7',
          border: `2px solid ${selected === trial.correctName ? '#86EFAC' : '#FDE68A'}`,
          borderRadius: 16,
          padding: '14px 18px',
          color: selected === trial.correctName ? '#15803D' : '#B45309',
          fontWeight: 700,
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <span>{selected === trial.correctName ? '🎉' : '💡'}</span>
          <span>{selected === trial.correctName ? 'Wonderful! That was the ink color!' : `Good try! The ink color was ${trial.correctName}.`}</span>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateOddOneOut, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// A repeating-field task, not a sequence one: a grid is filled with one
// repeated emoji and a single different one hides among them — genuinely
// distinct from PatternGame ("what comes next" in a 1D sequence) and
// BlockMemoryGame ("repeat a memorized spatial sequence"). Harder
// difficulties use visually closer pairs, making the outlier subtler
// rather than just adding more cells.
const PAIRS: Record<Difficulty, { base: string; odd: string }[]> = {
  easy: [
    { base: '●', odd: '▲' },
    { base: '■', odd: '★' },
    { base: '🌸', odd: '🍵' },
  ],
  medium: [
    { base: '🌸', odd: '🌺' },
    { base: '●', odd: '◆' },
    { base: '🍵', odd: '☕' },
  ],
  challenging: [
    { base: '🍎', odd: '🍏' },
    { base: '⭐', odd: '🌟' },
    { base: '🔵', odd: '🟣' },
  ],
};

const GRID_SIZE: Record<Difficulty, number> = { easy: 6, medium: 9, challenging: 12 };
const ROUND_COUNT = 3;

function buildRound(difficulty: Difficulty, pairIdx: number) {
  const { base, odd } = PAIRS[difficulty][pairIdx % PAIRS[difficulty].length];
  const size = GRID_SIZE[difficulty];
  const oddPosition = Math.floor(Math.random() * size);
  const cells = Array.from({ length: size }, (_, i) => (i === oddPosition ? odd : base));
  return { cells, oddPosition };
}

export default function OddOneOutGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const [rounds] = useState(() => Array.from({ length: ROUND_COUNT }, (_, i) => buildRound(difficulty, i)));
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [startTime] = useState(Date.now());

  const round = rounds[qIdx];
  const cols = round.cells.length <= 6 ? 3 : 4;

  const handlePick = (idx: number) => {
    if (answered) return;
    setPicked(idx);
    setAnswered(true);
    const isCorrect = idx === round.oddPosition;
    if (isCorrect) setCorrectCount((p) => p + 1);
    else setMistakeCount((p) => p + 1);
    voice.speakFeedback(narrateFeedback(lang, isCorrect));
  };

  const handleNext = () => {
    if (qIdx < rounds.length - 1) {
      setQIdx((p) => p + 1);
      setPicked(null);
      setAnswered(false);
    } else {
      const accuracy = Math.round((correctCount / rounds.length) * 100);
      onComplete(accuracy, mistakeCount, (Date.now() - startTime) / 1000);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Round {qIdx + 1} of {rounds.length}
      </p>

      <QuestionNarrator text={narrateOddOneOut(lang)} speakKey={qIdx}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Which One Doesn't Belong?</h2>
      </QuestionNarrator>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, marginBottom: 20,
        maxWidth: 320, margin: '0 auto 20px',
      }}>
        {round.cells.map((emoji, i) => {
          const isOdd = i === round.oddPosition;
          let border = 'var(--border-color)', bg = 'white';
          if (answered) {
            if (isOdd) { border = 'var(--color-success)'; bg = 'var(--color-success-light)'; }
            else if (i === picked) { border = 'var(--color-danger)'; bg = 'var(--color-danger-light)'; }
          } else if (i === picked) {
            border = 'var(--color-primary)'; bg = 'rgba(46,125,139,0.08)';
          }
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              style={{
                background: bg, border: `3px solid ${border}`, borderRadius: 14,
                padding: '14px 4px', fontSize: 30, cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.15s', aspectRatio: '1',
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {answered && (
        <div>
          <div style={{
            background: picked === round.oddPosition ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            color: picked === round.oddPosition ? '#2E7D32' : '#C62828', fontWeight: 600, fontSize: 16,
          }}>
            {picked === round.oddPosition ? '✓ Sharp eyes!' : 'Almost — look closer next time.'}
          </div>
          <button
            className="btn btn--primary"
            onClick={handleNext}
            style={{ width: '100%', height: 56, fontSize: 18, borderRadius: 16 }}
          >
            {qIdx < rounds.length - 1 ? 'Next Round →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateDailySequence, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

interface Step {
  emoji: string;
  label: string;
  order: number;
}

// A fixed, universally-recognizable daily routine — unlike RoutineRecallGame
// (which reorders a personalized list via up/down arrows), this game asks
// the user to tap steps directly in order, one at a time, with no way to
// "undo" a tap — a different memory/sequencing skill than list-reordering.
const ROUTINE: Step[] = [
  { emoji: '🌅', label: 'Wake up', order: 0 },
  { emoji: '🪥', label: 'Brush teeth', order: 1 },
  { emoji: '🍳', label: 'Breakfast', order: 2 },
  { emoji: '💊', label: 'Take medicine', order: 3 },
  { emoji: '🚶', label: 'Walk', order: 4 },
  { emoji: '🌙', label: 'Sleep', order: 5 },
];

const DISTRACTORS: Step[] = [
  { emoji: '🎸', label: 'Guitar', order: -1 },
  { emoji: '⚽', label: 'Football', order: -1 },
];

const STEP_COUNT: Record<Difficulty, number> = { easy: 4, medium: 5, challenging: 6 };

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function DailySequenceGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const stepCount = STEP_COUNT[difficulty];
  const [steps] = useState<Step[]>(() => ROUTINE.slice(0, stepCount));
  const [distractor] = useState<Step | null>(() =>
    difficulty === 'challenging' ? DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)] : null,
  );
  const [tiles] = useState<Step[]>(() => shuffle(distractor ? [...steps, distractor] : steps));
  const [nextOrder, setNextOrder] = useState(0);
  const [tappedCorrect, setTappedCorrect] = useState<Set<number>>(new Set());
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [startTime] = useState(Date.now());
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
  }, []);

  const finish = (correctCount: number, mistakeCount: number) => {
    setDone(true);
    const accuracy = Math.round((correctCount / steps.length) * 100);
    voice.speakFeedback(narrateFeedback(lang, mistakeCount === 0));
    finishTimer.current = setTimeout(
      () => onComplete(accuracy, mistakeCount, (Date.now() - startTime) / 1000),
      1300,
    );
  };

  const handleTap = (idx: number) => {
    if (done) return;
    const tile = tiles[idx];
    if (tile.order === nextOrder) {
      const nextTapped = new Set(tappedCorrect).add(idx);
      setTappedCorrect(nextTapped);
      if (nextOrder + 1 >= steps.length) {
        finish(steps.length, 0);
      } else {
        setNextOrder(nextOrder + 1);
      }
    } else {
      setWrongTile(idx);
      setTimeout(() => setWrongTile(null), 400);
      finish(nextOrder, 1);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <QuestionNarrator text={narrateDailySequence(lang)} speakKey="daily-sequence-instruction">
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tap the Routine, in Order</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {done ? 'Great effort!' : `Step ${Math.min(nextOrder + 1, steps.length)} of ${steps.length}`}
        </p>
      </QuestionNarrator>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20,
      }}>
        {tiles.map((tile, i) => {
          const isCorrectTapped = tappedCorrect.has(i);
          const isWrong = wrongTile === i;
          let bg = 'white', border = 'var(--border-color)';
          if (isCorrectTapped) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; }
          else if (isWrong) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; }
          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              disabled={done || isCorrectTapped}
              style={{
                position: 'relative', background: bg, border: `3px solid ${border}`,
                borderRadius: 16, padding: '18px 8px', cursor: done ? 'default' : 'pointer',
                transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}
            >
              {isCorrectTapped && (
                <span style={{
                  position: 'absolute', top: 6, left: 8, fontSize: 12, fontWeight: 800,
                  color: 'var(--color-success)',
                }}>
                  {tile.order + 1}
                </span>
              )}
              <span style={{ fontSize: 34 }}>{tile.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{tile.label}</span>
            </button>
          );
        })}
      </div>

      {done && (
        <div style={{
          background: 'var(--color-success-light)', borderRadius: 12, padding: '12px 16px',
          color: '#2E7D32', fontWeight: 600, fontSize: 15,
        }}>
          ✓ Checking your sequence...
        </div>
      )}
    </div>
  );
}

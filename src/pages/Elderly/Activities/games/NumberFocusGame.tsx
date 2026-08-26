import { useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateNumberFocus } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// Schulte table: a shuffled grid of numbers, tap them in ascending order.
// Grid size scales gently with difficulty — the reference always uses a
// fixed 5x5, which is a lot of scanning for a first attempt at this task.
const GRID_SIZE: Record<Difficulty, number> = { easy: 3, medium: 4, challenging: 5 };

function shuffledNumbers(count: number): number[] {
  const nums = Array.from({ length: count }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

export default function NumberFocusGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const size = GRID_SIZE[difficulty];
  const [grid] = useState(() => shuffledNumbers(size * size));
  const [nextExpected, setNextExpected] = useState(1);
  const [mistakeFlash, setMistakeFlash] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());

  const total = size * size;

  const handleTap = (num: number) => {
    if (num === nextExpected) {
      if (num === total) {
        const accuracy = Math.max(40, 100 - mistakes * 5);
        onComplete(accuracy, mistakes, (Date.now() - startTime) / 1000);
        return;
      }
      setNextExpected((p) => p + 1);
    } else {
      setMistakes((p) => p + 1);
      setMistakeFlash(num);
      setTimeout(() => setMistakeFlash(null), 350);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <QuestionNarrator text={narrateNumberFocus(lang)} speakKey="number-focus-instruction">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Tap in order</h2>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#E8F5F7', borderRadius: 99, padding: '8px 18px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Find:</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>{nextExpected}</span>
        </div>
      </QuestionNarrator>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 8,
        maxWidth: size >= 5 ? 380 : 320, margin: '0 auto',
      }}>
        {grid.map((num) => {
          const isDone = num < nextExpected;
          const isFlashing = mistakeFlash === num;
          return (
            <button
              key={num}
              onClick={() => handleTap(num)}
              disabled={isDone}
              style={{
                aspectRatio: '1', borderRadius: 12,
                border: `2px solid ${isFlashing ? 'var(--color-danger)' : isDone ? 'var(--color-success)' : 'var(--border-color)'}`,
                background: isFlashing ? 'var(--color-danger-light)' : isDone ? 'var(--color-success-light)' : 'white',
                color: isDone ? 'var(--color-success)' : 'var(--text-primary)',
                fontSize: size >= 5 ? 18 : 22, fontWeight: 800,
                cursor: isDone ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}

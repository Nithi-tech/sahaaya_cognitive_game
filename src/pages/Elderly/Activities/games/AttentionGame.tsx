import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateAttentionInstruction } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

const TARGETS_BY_DIFF: Record<Difficulty, { target: string; items: string[][] }> = {
  easy: {
    target: '🌸',
    items: [
      ['🌸', '🎋', '🌸', '🍚', '🌸', '🥭'],
      ['🎋', '🌸', '🍵', '🌸', '🐟', '🌸'],
    ],
  },
  medium: {
    target: '🌸',
    items: [
      ['🌸', '🎋', '🌸', '🍚', '🌸', '🥭', '🐘', '🪷', '🌸'],
      ['🎋', '🌸', '🍵', '🌸', '🐟', '🌸', '🏺', '🌸', '🌿'],
    ],
  },
  challenging: {
    target: '🌸',
    items: [
      ['🌸', '🎋', '🌸', '🍚', '🌸', '🥭', '🐘', '🪷', '🌸', '🍵', '🌸', '🌿'],
      ['🎋', '🌸', '🍵', '🌸', '🐟', '🌸', '🏺', '🌸', '🌿', '🌸', '🥥', '🌸'],
    ],
  },
};

export default function AttentionGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const { target, items } = TARGETS_BY_DIFF[difficulty];
  const [setIdx] = useState(() => Math.floor(Math.random() * items.length));
  const grid = items[setIdx];
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (completeTimer.current) clearTimeout(completeTimer.current);
  }, []);

  const targetIndices = new Set(grid.map((e, i) => e === target ? i : -1).filter(i => i >= 0));

  const toggle = (i: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const hits = [...selected].filter(i => targetIndices.has(i)).length;
    const misses = targetIndices.size - hits;
    const falsePositives = [...selected].filter(i => !targetIndices.has(i)).length;
    const accuracy = Math.max(0, Math.round((hits / targetIndices.size) * 100 - falsePositives * 15));
    const mistakes = misses + falsePositives;
    const rt = (Date.now() - startTime) / 1000;
    // Cleared on unmount — otherwise tapping "Back" during this window still
    // fires onComplete afterward and yanks the user into a results screen
    // they didn't ask for (ElderlyActivities.tsx forces screen='result').
    completeTimer.current = setTimeout(() => onComplete(accuracy, mistakes, rt), 1500);
  };

  const cols = 3;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-surface-tint)', borderRadius: 99, padding: '8px 16px',
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Find all:</span>
        <span style={{ fontSize: 28 }}>{target}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>Flowers</span>
      </div>

      <QuestionNarrator text={narrateAttentionInstruction(lang)} speakKey="attention-instruction">
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Tap all the Flowers!
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {targetIndices.size} flowers are hidden among other objects
        </p>
      </QuestionNarrator>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10, marginBottom: 20,
      }}>
        {grid.map((emoji, i) => {
          const isSelected = selected.has(i);
          const isTarget = targetIndices.has(i);
          let bg = 'white', border = 'var(--border-color)';
          if (submitted) {
            if (isTarget && isSelected) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; }
            else if (!isTarget && isSelected) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; }
            else if (isTarget && !isSelected) { bg = 'var(--color-warning-light)'; border = 'var(--color-warning)'; }
          } else if (isSelected) {
            bg = 'rgba(109,66,245,0.1)'; border = 'var(--color-primary)';
          }

          const mark = submitted
            ? (isTarget && isSelected) ? '✓' : (!isTarget && isSelected) ? '✗' : (isTarget && !isSelected) ? '!' : null
            : null;

          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              style={{
                position: 'relative',
                background: bg, border: `3px solid ${border}`,
                borderRadius: 16, padding: '16px 8px',
                fontSize: 40, cursor: 'pointer', transition: 'all 0.15s',
                transform: isSelected ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              {emoji}
              {mark && (
                <span style={{
                  position: 'absolute', top: 4, right: 6, fontSize: 15, fontWeight: 800,
                  color: mark === '✓' ? 'var(--color-success)' : mark === '✗' ? 'var(--color-danger)' : 'var(--color-warning)',
                }}>
                  {mark}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14 }}>
        <span style={{ color: 'var(--text-tertiary)' }}>Selected: {selected.size}</span>
        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          Target: {targetIndices.size} flowers
        </span>
      </div>

      {!submitted ? (
        <button
          className="btn btn--primary"
          onClick={handleSubmit}
          disabled={selected.size === 0}
          style={{ width: '100%', height: 60, fontSize: 18, borderRadius: 16 }}
        >
          Submit
        </button>
      ) : (
        <div style={{
          background: 'var(--color-success-light)', borderRadius: 12, padding: '12px 16px',
          color: 'var(--color-success-text)', fontWeight: 600, fontSize: 15,
        }}>
          ✓ Checking answers...
        </div>
      )}
    </div>
  );
}

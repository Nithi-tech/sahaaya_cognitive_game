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
      {/* Friendly Target Banner */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        border: '2px solid #F59E0B',
        borderRadius: 999,
        padding: '8px 22px',
        marginBottom: 18,
        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Find all:
        </span>
        <span style={{ fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{target}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#92400E' }}>Flowers</span>
      </div>

      <QuestionNarrator text={narrateAttentionInstruction(lang)} speakKey="attention-instruction">
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          Tap all the Flowers!
        </h2>
        <p style={{ fontSize: 15, color: '#64748B', marginBottom: 20, fontWeight: 600 }}>
          💡 {targetIndices.size} flowers are hidden among other objects
        </p>
      </QuestionNarrator>

      {/* Grid of Items */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 12,
        marginBottom: 20,
      }}>
        {grid.map((emoji, i) => {
          const isSelected = selected.has(i);
          const isTarget = targetIndices.has(i);
          let bg = '#FFFFFF', border = '#CBD5E1', shadow = '0 4px 10px rgba(0,0,0,0.04)';

          if (submitted) {
            if (isTarget && isSelected) {
              bg = '#DCFCE7';
              border = '#16A34A';
              shadow = '0 4px 14px rgba(22, 163, 74, 0.25)';
            } else if (!isTarget && isSelected) {
              bg = '#FEE2E2';
              border = '#DC2626';
            } else if (isTarget && !isSelected) {
              bg = '#FEF3C7';
              border = '#D97706';
            }
          } else if (isSelected) {
            bg = '#F0F9FF';
            border = '#0284C7';
            shadow = '0 4px 14px rgba(2, 132, 199, 0.25)';
          }

          const mark = submitted
            ? (isTarget && isSelected) ? '✓' : (!isTarget && isSelected) ? '✗' : (isTarget && !isSelected) ? '!' : null
            : null;

          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={submitted}
              style={{
                position: 'relative',
                background: bg,
                border: `3px solid ${border}`,
                borderRadius: 22,
                padding: '18px 8px',
                fontSize: 48,
                cursor: submitted ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                transform: isSelected ? 'scale(0.96)' : 'scale(1)',
                boxShadow: shadow,
                minHeight: 78,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span>{emoji}</span>

              {/* Selected blue indicator */}
              {!submitted && isSelected && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#0284C7',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  ✓
                </span>
              )}

              {mark && (
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  fontSize: 18,
                  fontWeight: 800,
                  color: mark === '✓' ? '#16A34A' : mark === '✗' ? '#DC2626' : '#D97706',
                }}>
                  {mark}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected vs Target Counter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#F8FAFC',
        border: '1.5px solid #E2E8F0',
        borderRadius: 14,
        padding: '10px 16px',
        marginBottom: 18,
        fontSize: 14,
      }}>
        <span style={{ color: '#64748B', fontWeight: 600 }}>
          Selected: <strong style={{ color: '#0F172A', fontSize: 16 }}>{selected.size}</strong>
        </span>
        <span style={{ color: '#0369A1', fontWeight: 700 }}>
          Goal: {targetIndices.size} flowers
        </span>
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          style={{
            width: '100%',
            height: 56,
            fontSize: 18,
            borderRadius: 999,
            fontWeight: 800,
            color: 'white',
            background: selected.size === 0 ? '#94A3B8' : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            border: 'none',
            cursor: selected.size === 0 ? 'default' : 'pointer',
            boxShadow: selected.size === 0 ? 'none' : '0 8px 20px rgba(2, 132, 199, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <span>✓ Submit Selection</span>
        </button>
      ) : (
        <div style={{
          background: '#DCFCE7',
          border: '2px solid #86EFAC',
          borderRadius: 16,
          padding: '14px',
          color: '#15803D',
          fontWeight: 700,
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span>🎉 Checking your answers... ✓</span>
        </div>
      )}
    </div>
  );
}

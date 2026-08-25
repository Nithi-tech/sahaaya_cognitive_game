import { useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { SpeakableLabel } from '../../../../components/Voice/SpeakableLabel';
import { narrateRoutineInstruction, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

interface RoutineItem {
  emoji: string;
  label: string;
  correctOrder: number;
}

const ROUTINES: Record<Difficulty, RoutineItem[]> = {
  easy: [
    { emoji: '🌅', label: 'Wake up', correctOrder: 0 },
    { emoji: '🍵', label: 'Morning Tea', correctOrder: 1 },
    { emoji: '💊', label: 'Take medicine', correctOrder: 2 },
    { emoji: '🍚', label: 'Eat breakfast', correctOrder: 3 },
  ],
  medium: [
    { emoji: '🌅', label: 'Wake up', correctOrder: 0 },
    { emoji: '🦷', label: 'Brush teeth', correctOrder: 1 },
    { emoji: '💧', label: 'Drink water', correctOrder: 2 },
    { emoji: '💊', label: 'Take medicine', correctOrder: 3 },
    { emoji: '🍚', label: 'Eat breakfast', correctOrder: 4 },
  ],
  challenging: [
    { emoji: '🌅', label: 'Wake up', correctOrder: 0 },
    { emoji: '🦷', label: 'Brush teeth', correctOrder: 1 },
    { emoji: '🚶', label: 'Morning walk', correctOrder: 2 },
    { emoji: '💧', label: 'Drink water', correctOrder: 3 },
    { emoji: '💊', label: 'Take medicine', correctOrder: 4 },
    { emoji: '🍚', label: 'Eat breakfast', correctOrder: 5 },
  ],
};

export default function RoutineRecallGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const correctRoutine = ROUTINES[difficulty];
  const [items, setItems] = useState<RoutineItem[]>(() =>
    [...correctRoutine].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const correctCount = items.filter(
      (item, idx) => item.correctOrder === idx
    ).length;
    const accuracy = Math.round((correctCount / items.length) * 100);
    const mistakes = items.length - correctCount;
    voice.speakFeedback(narrateFeedback(lang, accuracy >= 70));
    setTimeout(() => onComplete(accuracy, mistakes, (Date.now() - startTime) / 1000), 1500);
  };

  return (
    <div>
      <QuestionNarrator text={narrateRoutineInstruction(lang)} speakKey="routine-instruction">
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>
          Morning Routine
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20, textAlign: 'center' }}>
          Arrange these activities in the correct order
        </p>
      </QuestionNarrator>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {items.map((item, idx) => {
          const isCorrect = item.correctOrder === idx;
          let bg = 'white', border = 'var(--border-color)';
          if (submitted) {
            bg = isCorrect ? 'var(--color-success-light)' : 'var(--color-danger-light)';
            border = isCorrect ? 'var(--color-success)' : 'var(--color-danger)';
          }
          return (
            <div
              key={item.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: bg, border: `2px solid ${border}`,
                borderRadius: 16, padding: '14px 16px',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 99,
                background: 'var(--border-color)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)',
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <span style={{ fontSize: 32 }}>{item.emoji}</span>
              <span style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>{item.label}</span>
              <SpeakableLabel text={item.label} />
              {!submitted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => moveUp(idx)}
                    style={{
                      background: idx === 0 ? '#F5F5F5' : 'var(--color-primary)',
                      color: idx === 0 ? '#CCC' : 'white',
                      border: 'none', borderRadius: 8, padding: '6px 10px',
                      cursor: idx === 0 ? 'default' : 'pointer', fontSize: 14, fontWeight: 700,
                    }}
                  >↑</button>
                  <button
                    onClick={() => moveDown(idx)}
                    style={{
                      background: idx === items.length - 1 ? '#F5F5F5' : 'var(--color-primary)',
                      color: idx === items.length - 1 ? '#CCC' : 'white',
                      border: 'none', borderRadius: 8, padding: '6px 10px',
                      cursor: idx === items.length - 1 ? 'default' : 'pointer', fontSize: 14, fontWeight: 700,
                    }}
                  >↓</button>
                </div>
              )}
              {submitted && (
                <span style={{ fontSize: 24 }}>{isCorrect ? '✓' : '✗'}</span>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          className="btn btn--primary"
          onClick={handleSubmit}
          style={{ width: '100%', height: 60, fontSize: 18, borderRadius: 16, fontWeight: 700 }}
        >
          Submit Order
        </button>
      ) : (
        <div style={{
          background: 'var(--color-success-light)', borderRadius: 12, padding: '12px 16px',
          color: '#2E7D32', fontWeight: 600, fontSize: 15, textAlign: 'center',
        }}>
          ✓ Evaluating your routine order...
        </div>
      )}
    </div>
  );
}

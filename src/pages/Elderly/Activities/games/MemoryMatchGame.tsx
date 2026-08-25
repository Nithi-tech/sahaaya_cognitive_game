import { useState, useEffect, useRef } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { SpeakableLabel } from '../../../../components/Voice/SpeakableLabel';
import { narrateMemoryLook, narrateMemoryRecall, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

const ITEMS_BY_DIFF: Record<Difficulty, string[][]> = {
  easy: [
    ['🍵', '🥭', '🎋', '🌸'],
    ['🍚', '🍌', '🌿', '🐟'],
  ],
  medium: [
    ['🍵', '🥭', '🎋', '🌸', '🍚', '🐘'],
    ['🍌', '🌿', '🐟', '🏺', '🪔', '☂️'],
  ],
  challenging: [
    ['🍵', '🥭', '🎋', '🌸', '🍚', '🐘', '🍌', '🌿'],
    ['🐟', '🏺', '🪔', '☂️', '🥥', '🪷', '🦏', '🐦'],
  ],
};

const ITEM_LABELS: Record<string, string> = {
  '🍵': 'Tea', '🥭': 'Mango', '🎋': 'Bamboo', '🌸': 'Flower',
  '🍚': 'Rice', '🍌': 'Banana', '🌿': 'Plant', '🐟': 'Fish',
  '🐘': 'Elephant', '🏺': 'Pot', '🪔': 'Lamp', '☂️': 'Umbrella',
  '🥥': 'Coconut', '🪷': 'Lotus', '🦏': 'Rhino', '🐦': 'Bird',
};

type Phase = 'memorize' | 'recall' | 'feedback';

export default function MemoryMatchGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const sets = ITEMS_BY_DIFF[difficulty];
  const [setIdx] = useState(() => Math.floor(Math.random() * sets.length));
  const items = sets[setIdx];

  const [phase, setPhase] = useState<Phase>('memorize');
  const [timeLeft, setTimeLeft] = useState(difficulty === 'easy' ? 5 : difficulty === 'medium' ? 4 : 3);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (completeTimer.current) clearTimeout(completeTimer.current);
  }, []);

  // All emojis for distractor pool
  const allEmojis = Object.keys(ITEM_LABELS);
  const distractors = allEmojis.filter(e => !items.includes(e)).sort(() => Math.random() - 0.5).slice(0, difficulty === 'easy' ? 2 : 4);
  const options = [...items, ...distractors].sort(() => Math.random() - 0.5).slice(0, difficulty === 'easy' ? 6 : difficulty === 'medium' ? 9 : 12);
  const [optionsList] = useState(options);

  // Countdown timer for memorize phase
  useEffect(() => {
    if (phase !== 'memorize') return;
    if (timeLeft <= 0) { setPhase('recall'); return; }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const toggleSelect = (emoji: string) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(emoji)) next.delete(emoji);
      else next.add(emoji);
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setPhase('feedback');
    const correctCount = items.filter(i => selected.has(i)).length;
    const falsePositives = [...selected].filter(s => !items.includes(s)).length;
    const accuracy = Math.round((correctCount / items.length) * 100 - falsePositives * 10);
    const clamped = Math.max(0, Math.min(100, accuracy));
    voice.speakFeedback(narrateFeedback(lang, clamped >= 70));
    const mistakes = items.filter(i => !selected.has(i)).length + falsePositives;
    completeTimer.current = setTimeout(() => onComplete(clamped, mistakes), 1500);
  };

  if (phase === 'memorize') {
    return (
      <QuestionNarrator text={narrateMemoryLook(lang)} speakKey="memorize">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>
            Remember these objects!
          </div>
          <div style={{
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 99,
            display: 'inline-block',
            padding: '6px 20px',
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 28,
            minWidth: 56,
          }}>
            {timeLeft}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`, gap: 12 }}>
            {items.map((emoji) => (
              <div key={emoji} style={{
                background: 'white', borderRadius: 20, padding: '20px 12px',
                border: '2px solid var(--border-color)', textAlign: 'center',
                boxShadow: 'var(--shadow-sm)', position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <SpeakableLabel text={ITEM_LABELS[emoji]} />
                </div>
                <div style={{ fontSize: 48 }}>{emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, color: 'var(--text-secondary)' }}>
                  {ITEM_LABELS[emoji]}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20, color: 'var(--text-tertiary)', fontSize: 14 }}>
            Look carefully — they will disappear!
          </p>
        </div>
      </QuestionNarrator>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <QuestionNarrator text={narrateMemoryRecall(lang)} speakKey="recall">
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          Which objects did you see?
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Tap all the ones you remember
        </p>
      </QuestionNarrator>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${difficulty === 'easy' ? 2 : 3}, 1fr)`,
        gap: 10, marginBottom: 24,
      }}>
        {optionsList.map((emoji) => {
          const isSelected = selected.has(emoji);
          const isCorrect = items.includes(emoji);
          let bgColor = 'white';
          let borderColor = 'var(--border-color)';
          if (submitted) {
            if (isCorrect && isSelected) { bgColor = 'var(--color-success-light)'; borderColor = 'var(--color-success)'; }
            else if (!isCorrect && isSelected) { bgColor = 'var(--color-danger-light)'; borderColor = 'var(--color-danger)'; }
            else if (isCorrect && !isSelected) { bgColor = '#FFF3E0'; borderColor = 'var(--color-warning)'; }
          } else if (isSelected) {
            bgColor = 'rgba(46,125,139,0.08)';
            borderColor = 'var(--color-primary)';
          }

          const mark = submitted
            ? (isCorrect && isSelected) ? '✓' : (!isCorrect && isSelected) ? '✗' : (isCorrect && !isSelected) ? '!' : null
            : null;

          return (
            <button
              key={emoji}
              onClick={() => toggleSelect(emoji)}
              style={{
                position: 'relative',
                background: bgColor,
                border: `3px solid ${borderColor}`,
                borderRadius: 16,
                padding: '16px 8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {mark && (
                <span style={{
                  position: 'absolute', top: 6, right: 8, fontSize: 15, fontWeight: 800,
                  color: mark === '✓' ? 'var(--color-success)' : mark === '✗' ? 'var(--color-danger)' : 'var(--color-warning)',
                }}>
                  {mark}
                </span>
              )}
              <span style={{ fontSize: 36 }}>{emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {ITEM_LABELS[emoji]}
              </span>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          className="btn btn--primary"
          onClick={handleSubmit}
          disabled={selected.size === 0}
          style={{ width: '100%', height: 60, fontSize: 18, borderRadius: 16, fontWeight: 700 }}
        >
          Submit Answers
        </button>
      )}

      {submitted && (
        <div style={{
          background: 'var(--color-success-light)',
          borderRadius: 16, padding: '16px',
          fontSize: 15, color: '#2E7D32', fontWeight: 600,
        }}>
          Checking your answers... ✓
        </div>
      )}
    </div>
  );
}

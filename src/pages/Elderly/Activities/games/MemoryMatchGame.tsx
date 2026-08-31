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
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          {/* Calming, clear countdown badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: 'white',
            borderRadius: 999,
            padding: '8px 24px',
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 24,
            boxShadow: '0 6px 18px rgba(2, 132, 199, 0.25)',
          }}>
            <span>⏱️ Remember these items:</span>
            <span style={{ fontSize: 24, minWidth: 28 }}>{timeLeft}s</span>
          </div>

          {/* Cards to remember */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`, gap: 14 }}>
            {items.map((emoji) => (
              <div key={emoji} style={{
                background: '#FFFFFF',
                borderRadius: 24,
                padding: '22px 12px',
                border: '3px solid #E2E8F0',
                textAlign: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <SpeakableLabel text={ITEM_LABELS[emoji]} />
                </div>
                <div style={{ fontSize: 52, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}>{emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10, color: '#1E293B' }}>
                  {ITEM_LABELS[emoji]}
                </div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 22, color: '#64748B', fontSize: 15, fontWeight: 600 }}>
            👀 Look carefully — they will hide in a moment!
          </p>
        </div>
      </QuestionNarrator>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <QuestionNarrator text={narrateMemoryRecall(lang)} speakKey="recall">
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          Which objects did you see?
        </h2>
        <p style={{ fontSize: 16, color: '#475569', marginBottom: 22, fontWeight: 500 }}>
          Tap all the items you remember:
        </p>
      </QuestionNarrator>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${difficulty === 'easy' ? 2 : 3}, 1fr)`,
        gap: 12,
        marginBottom: 24,
      }}>
        {optionsList.map((emoji) => {
          const isSelected = selected.has(emoji);
          const isCorrect = items.includes(emoji);
          let bgColor = '#FFFFFF';
          let borderColor = '#CBD5E1';
          let shadow = '0 3px 8px rgba(0,0,0,0.04)';

          if (submitted) {
            if (isCorrect && isSelected) {
              bgColor = '#DCFCE7';
              borderColor = '#16A34A';
              shadow = '0 4px 14px rgba(22, 163, 74, 0.25)';
            } else if (!isCorrect && isSelected) {
              bgColor = '#FEE2E2';
              borderColor = '#DC2626';
            } else if (isCorrect && !isSelected) {
              bgColor = '#FEF3C7';
              borderColor = '#D97706';
            }
          } else if (isSelected) {
            bgColor = '#F0F9FF';
            borderColor = '#0284C7';
            shadow = '0 4px 14px rgba(2, 132, 199, 0.2)';
          }

          const mark = submitted
            ? (isCorrect && isSelected) ? '✓' : (!isCorrect && isSelected) ? '✗' : (isCorrect && !isSelected) ? '!' : null
            : null;

          return (
            <button
              key={emoji}
              onClick={() => toggleSelect(emoji)}
              disabled={submitted}
              style={{
                position: 'relative',
                background: bgColor,
                border: `3px solid ${borderColor}`,
                borderRadius: 22,
                padding: '18px 10px',
                cursor: submitted ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                boxShadow: shadow,
              }}
            >
              {/* Selected indicator badge */}
              {!submitted && isSelected && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#0284C7',
                  color: 'white',
                  fontSize: 13,
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
                  top: 8,
                  right: 8,
                  fontSize: 18,
                  fontWeight: 800,
                  color: mark === '✓' ? '#16A34A' : mark === '✗' ? '#DC2626' : '#D97706',
                }}>
                  {mark}
                </span>
              )}
              <span style={{ fontSize: 44 }}>{emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                {ITEM_LABELS[emoji]}
              </span>
            </button>
          );
        })}
      </div>

      {!submitted && (
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
          <span>✓ Submit Answers ({selected.size} selected)</span>
        </button>
      )}

      {submitted && (
        <div style={{
          background: '#DCFCE7',
          border: '2px solid #86EFAC',
          borderRadius: 16,
          padding: '16px',
          fontSize: 16,
          color: '#15803D',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span>🎉 Checking your memory answers... ✓</span>
        </div>
      )}
    </div>
  );
}

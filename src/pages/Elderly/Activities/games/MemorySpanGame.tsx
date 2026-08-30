import { useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateMemorySpan, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// A verbal short-term recall test — a different memory channel than
// MemoryMatchGame's pictorial objects (words, not images), reimplemented
// independently from the "free-short-term-memory-test" reference (see
// docs/LICENSE_DECISION.md). Two deliberate elderly-first departures from
// that reference: study time is self-paced (tap "I'm Ready" whenever, not a
// fixed countdown), and recall is tap-to-recognize from a grid rather than
// typing — typing on a touchscreen is a real accessibility barrier this
// app's other games already avoid (Memory Match, Object Recognition, Family
// & Faces are all tap-based), so this follows that same precedent.
const WORD_BANK = [
  'Tea', 'Rice', 'Mango', 'Umbrella', 'Lamp', 'River', 'Basket', 'Coconut',
  'Bicycle', 'Garden', 'Pillow', 'Kettle', 'Mirror', 'Candle', 'Bridge',
  'Bench', 'Ladder', 'Blanket', 'Lantern', 'Well', 'Courtyard', 'Cushion',
  'Broom', 'Sandals',
];

const WORD_COUNT: Record<Difficulty, number> = { easy: 4, medium: 6, challenging: 8 };

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Phase = 'study' | 'recall' | 'feedback';

export default function MemorySpanGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const count = WORD_COUNT[difficulty];
  const [words] = useState(() => shuffled(WORD_BANK).slice(0, count));
  const [options] = useState(() => {
    const distractors = shuffled(WORD_BANK.filter((w) => !words.includes(w))).slice(0, count);
    return shuffled([...words, ...distractors]);
  });

  const [phase, setPhase] = useState<Phase>('study');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSelect = (word: string) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setPhase('feedback');
    const correctCount = words.filter((w) => selected.has(w)).length;
    const falsePositives = [...selected].filter((w) => !words.includes(w)).length;
    const accuracy = Math.max(0, Math.min(100, Math.round((correctCount / words.length) * 100 - falsePositives * 10)));
    const mistakes = (words.length - correctCount) + falsePositives;
    voice.speakFeedback(narrateFeedback(lang, accuracy >= 70));
    completeTimer.current = setTimeout(() => onComplete(accuracy, mistakes, (Date.now() - startTime) / 1000), 1500);
  };

  if (phase === 'study') {
    return (
      <QuestionNarrator text={narrateMemorySpan(lang)} speakKey="memory-span-study">
        <div style={{ textAlign: 'center', padding: '4px 0' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Remember these words</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            Take your time — tap "I'm Ready" when you've studied them
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(${Math.min(words.length, 3)}, 1fr)`,
            gap: 10, marginBottom: 24,
          }}>
            {words.map((w) => (
              <div key={w} style={{
                background: 'white', borderRadius: 16, padding: '18px 8px',
                border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
                fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
              }}>
                {w}
              </div>
            ))}
          </div>

          <button
            className="btn btn--primary"
            onClick={() => setPhase('recall')}
            style={{ width: '100%', height: 60, fontSize: 18, borderRadius: 16, fontWeight: 700 }}
          >
            I'm Ready
          </button>
        </div>
      </QuestionNarrator>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Which words did you see?</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Tap all the ones you remember
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)`,
        gap: 10, marginBottom: 24,
      }}>
        {options.map((w) => {
          const isSelected = selected.has(w);
          const isCorrect = words.includes(w);
          let bg = 'white', border = 'var(--border-color)';
          if (submitted) {
            if (isCorrect && isSelected) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; }
            else if (!isCorrect && isSelected) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; }
            else if (isCorrect && !isSelected) { bg = 'var(--color-warning-light)'; border = 'var(--color-warning)'; }
          } else if (isSelected) {
            bg = 'rgba(109,66,245,0.08)'; border = 'var(--color-primary)';
          }
          return (
            <button
              key={w}
              onClick={() => toggleSelect(w)}
              disabled={submitted}
              style={{
                background: bg, border: `3px solid ${border}`, borderRadius: 16,
                padding: '16px 8px', cursor: submitted ? 'default' : 'pointer',
                fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
              }}
            >
              {w}
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
          background: 'var(--color-success-light)', borderRadius: 16, padding: '16px',
          fontSize: 15, color: 'var(--color-success-text)', fontWeight: 600,
        }}>
          Checking your answers... ✓
        </div>
      )}
    </div>
  );
}

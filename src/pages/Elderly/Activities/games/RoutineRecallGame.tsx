import { useState, useEffect, useRef, useMemo } from 'react';
import type { Difficulty, OnboardingRoutineSection } from '../../../../types';
import { useApp } from '../../../../store/AppContext';
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

/** Builds a personalized routine from the caregiver's onboarding answers, ordered by time-of-day. */
function buildPersonalRoutine(routine: OnboardingRoutineSection): RoutineItem[] {
  const timed: { emoji: string; label: string; time: string }[] = [];
  if (routine.wakeTime) timed.push({ emoji: '🌅', label: 'Wake up', time: routine.wakeTime });
  if (routine.breakfastTime) timed.push({ emoji: '🍚', label: 'Breakfast', time: routine.breakfastTime });
  if (routine.lunchTime) timed.push({ emoji: '🍛', label: 'Lunch', time: routine.lunchTime });
  if (routine.dinnerTime) timed.push({ emoji: '🍽️', label: 'Dinner', time: routine.dinnerTime });
  if (routine.sleepTime) timed.push({ emoji: '😴', label: 'Sleep', time: routine.sleepTime });

  if (routine.rituals) {
    // Free-text rituals have no clock time — slot them right after wake-up
    // (most rituals like prayer/tea happen early), one entry per phrase.
    const wakeIdx = timed.findIndex((t) => t.label === 'Wake up');
    const insertAt = wakeIdx >= 0 ? wakeIdx + 1 : 0;
    const anchorTime = wakeIdx >= 0 ? timed[wakeIdx].time : '06:30';
    routine.rituals.split(',').map((r) => r.trim()).filter(Boolean).forEach((ritual, i) => {
      timed.splice(insertAt + i, 0, { emoji: '🙏', label: ritual, time: anchorTime });
    });
  }

  return timed
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((t, i) => ({ emoji: t.emoji, label: routine.activityPhrase && t.label === 'Wake up' ? routine.activityPhrase : t.label, correctOrder: i }));
}

export default function RoutineRecallGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const { currentPatient } = useApp();
  const onboardingRoutine = currentPatient?.preferences?.onboarding?.routine;
  const correctRoutine = useMemo(() => {
    const personal = onboardingRoutine ? buildPersonalRoutine(onboardingRoutine) : [];
    return personal.length >= 3 ? personal : ROUTINES[difficulty];
  }, [onboardingRoutine, difficulty]);
  const [items, setItems] = useState<RoutineItem[]>(() =>
    [...correctRoutine].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (completeTimer.current) clearTimeout(completeTimer.current);
  }, []);

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
    completeTimer.current = setTimeout(() => onComplete(accuracy, mistakes, (Date.now() - startTime) / 1000), 1500);
  };

  return (
    <div>
      <QuestionNarrator text={narrateRoutineInstruction(lang)} speakKey="routine-instruction">
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 6, textAlign: 'center' }}>
          Daily Routine Order
        </h2>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 24, textAlign: 'center', fontWeight: 500 }}>
          Arrange these activities from morning to night using the arrows:
        </p>
      </QuestionNarrator>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {items.map((item, idx) => {
          const isCorrect = item.correctOrder === idx;
          let bg = '#FFFFFF', border = '#E2E8F0', shadow = '0 4px 12px rgba(0,0,0,0.04)';
          if (submitted) {
            bg = isCorrect ? '#DCFCE7' : '#FEE2E2';
            border = isCorrect ? '#16A34A' : '#DC2626';
            shadow = isCorrect ? '0 4px 14px rgba(22, 163, 74, 0.2)' : 'none';
          }
          return (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: bg,
                border: `3px solid ${border}`,
                borderRadius: 20,
                padding: '16px 18px',
                transition: 'all 0.2s ease',
                boxShadow: shadow,
                minHeight: 74,
              }}
            >
              <span style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#F1F5F9',
                border: '2px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: '#0F172A',
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <span style={{ fontSize: 36 }}>{item.emoji}</span>
              <span style={{ fontSize: 18, fontWeight: 700, flex: 1, color: '#1E293B' }}>{item.label}</span>
              <SpeakableLabel text={item.label} />

              {!submitted && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    aria-label={`Move ${item.label} earlier`}
                    style={{
                      width: 44,
                      height: 44,
                      background: idx === 0 ? '#F1F5F9' : '#0284C7',
                      color: idx === 0 ? '#94A3B8' : 'white',
                      border: 'none',
                      borderRadius: 12,
                      cursor: idx === 0 ? 'default' : 'pointer',
                      fontSize: 18,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === items.length - 1}
                    aria-label={`Move ${item.label} later`}
                    style={{
                      width: 44,
                      height: 44,
                      background: idx === items.length - 1 ? '#F1F5F9' : '#0284C7',
                      color: idx === items.length - 1 ? '#94A3B8' : 'white',
                      border: 'none',
                      borderRadius: 12,
                      cursor: idx === items.length - 1 ? 'default' : 'pointer',
                      fontSize: 18,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ▼
                  </button>
                </div>
              )}

              {submitted && (
                <span style={{ fontSize: 26, fontWeight: 800, color: isCorrect ? '#16A34A' : '#DC2626' }}>
                  {isCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            height: 56,
            fontSize: 18,
            borderRadius: 999,
            fontWeight: 800,
            color: 'white',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>✓ Submit Routine Order</span>
        </button>
      ) : (
        <div style={{
          background: '#DCFCE7',
          border: '2px solid #86EFAC',
          borderRadius: 16,
          padding: '16px',
          color: '#15803D',
          fontWeight: 700,
          fontSize: 16,
          textAlign: 'center',
        }}>
          <span>🎉 Evaluating your routine order... ✓</span>
        </div>
      )}
    </div>
  );
}

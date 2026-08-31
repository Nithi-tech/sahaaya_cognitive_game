import { useState, useMemo } from 'react';
import type { Difficulty, Memory, OnboardingPerson } from '../../../../types';
import { useApp } from '../../../../store/AppContext';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateFaceNameMatch, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  memories: Memory[];
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

interface FaceOption {
  name: string;
  photoUrl?: string;
  emoji: string;
}

interface Round {
  correctName: string;
  options: FaceOption[];
}

const OPTION_COUNT: Record<Difficulty, number> = { easy: 3, medium: 4, challenging: 4 };

// Generic name/picture pairs used whenever the elder has fewer than 2 known
// family members — unlike FamilyFacesGame, this game is never gated behind
// the family-memory unlock, since recognition practice shouldn't depend on
// how much onboarding data a caregiver has entered.
const GENERIC_PAIRS: { name: string; emoji: string }[] = [
  { name: 'Basket', emoji: '🧺' }, { name: 'Tea Cup', emoji: '🍵' }, { name: 'Umbrella', emoji: '☂️' },
  { name: 'Lotus', emoji: '🪷' }, { name: 'Clay Pot', emoji: '🏺' }, { name: 'Coconut', emoji: '🥥' },
  { name: 'Oil Lamp', emoji: '🪔' }, { name: 'Bamboo', emoji: '🎋' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildRounds(memories: Memory[], onboardingPeople: OnboardingPerson[], difficulty: Difficulty): Round[] {
  const optionCount = OPTION_COUNT[difficulty];

  let pool: FaceOption[];
  if (onboardingPeople.length + memories.filter((m) => m.category === 'family').length >= 2) {
    const fromOnboarding = onboardingPeople
      .filter((p) => p.callsBy || p.name)
      .map((p): FaceOption => ({ name: p.callsBy || p.name, photoUrl: p.photoUrl, emoji: '🧑' }));
    const fromMemories = memories
      .filter((m) => m.category === 'family')
      .map((m): FaceOption => ({ name: m.title, photoUrl: m.imageUrl, emoji: '🧑' }));
    const seen = new Set<string>();
    pool = [...fromOnboarding, ...fromMemories].filter((p) => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
  } else {
    pool = GENERIC_PAIRS.map((p) => ({ name: p.name, emoji: p.emoji }));
  }

  if (pool.length < 2) return [];

  const roundCount = Math.min(4, pool.length);
  const chosen = shuffle(pool).slice(0, roundCount);

  return chosen.map((correct) => {
    const distractors = shuffle(pool.filter((p) => p.name !== correct.name)).slice(0, optionCount - 1);
    return {
      correctName: correct.name,
      options: shuffle([correct, ...distractors]),
    };
  });
}

export default function FaceNameMatchGame({ difficulty, memories, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const { currentPatient } = useApp();
  const onboardingPeople = useMemo(
    () => currentPatient?.preferences?.onboarding?.people?.people ?? [],
    [currentPatient],
  );
  const rounds = useMemo(() => buildRounds(memories, onboardingPeople, difficulty), [memories, onboardingPeople, difficulty]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [startTime] = useState(Date.now());

  if (rounds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🖼️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Not enough to match yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Please try again in a moment.</p>
      </div>
    );
  }

  const round = rounds[qIdx];

  const handleSelect = (opt: FaceOption) => {
    if (answered) return;
    setSelected(opt.name);
    setAnswered(true);
    const isCorrect = opt.name === round.correctName;
    if (isCorrect) setCorrectCount((p) => p + 1);
    else setMistakeCount((p) => p + 1);
    voice.speakFeedback(narrateFeedback(lang, isCorrect));
  };

  const handleNext = () => {
    if (qIdx < rounds.length - 1) {
      setQIdx((p) => p + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const accuracy = Math.round((correctCount / rounds.length) * 100);
      onComplete(accuracy, mistakeCount, (Date.now() - startTime) / 1000);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Question {qIdx + 1} of {rounds.length}
      </p>

      <QuestionNarrator text={narrateFaceNameMatch(lang)} speakKey={qIdx}>
        <div style={{
          display: 'inline-block', background: 'var(--color-primary)', color: 'white',
          borderRadius: 18, padding: '16px 32px', fontSize: 26, fontWeight: 800, marginBottom: 28,
        }}>
          {round.correctName}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)' }}>
          Tap the matching photo
        </h2>
      </QuestionNarrator>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${round.options.length <= 3 ? round.options.length : 2}, 1fr)`,
        gap: 12, marginBottom: 20,
      }}>
        {round.options.map((opt) => {
          const isCorrectOpt = opt.name === round.correctName;
          let border = 'var(--border-color)', bg = 'white';
          if (answered) {
            if (isCorrectOpt) { border = 'var(--color-success)'; bg = 'var(--color-success-light)'; }
            else if (opt.name === selected) { border = 'var(--color-danger)'; bg = 'var(--color-danger-light)'; }
          } else if (opt.name === selected) {
            border = 'var(--color-primary)'; bg = 'rgba(46,125,139,0.08)';
          }
          return (
            <button
              key={opt.name}
              onClick={() => handleSelect(opt)}
              style={{
                background: bg, border: `3px solid ${border}`, borderRadius: 18,
                padding: 14, cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s',
              }}
            >
              {opt.photoUrl ? (
                <img
                  src={opt.photoUrl} alt=""
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12 }}
                />
              ) : (
                <div style={{ fontSize: 56 }}>{opt.emoji}</div>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div>
          <div style={{
            background: selected === round.correctName ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            color: selected === round.correctName ? '#2E7D32' : '#C62828', fontWeight: 600, fontSize: 16,
          }}>
            {selected === round.correctName ? '✓ That\'s right!' : `That was ${round.correctName}.`}
          </div>
          <button
            className="btn btn--primary"
            onClick={handleNext}
            style={{ width: '100%', height: 56, fontSize: 18, borderRadius: 16 }}
          >
            {qIdx < rounds.length - 1 ? 'Next Question →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}

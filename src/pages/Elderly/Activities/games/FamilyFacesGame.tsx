import { useState, useMemo, useRef } from 'react';
import type { Difficulty, Memory, OnboardingPerson } from '../../../../types';
import { useApp } from '../../../../store/AppContext';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateFamilyFacesAsk, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  memories: Memory[];
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

const AVATAR_BY_RELATIONSHIP: { match: RegExp; emoji: string }[] = [
  { match: /daughter|granddaughter|niece/i, emoji: '👩' },
  { match: /son|grandson|nephew/i, emoji: '👨' },
  { match: /wife|mother|mom/i, emoji: '👵' },
  { match: /husband|father|dad/i, emoji: '👴' },
  { match: /caregiver/i, emoji: '🧑‍⚕️' },
];

function avatarFor(relationship: string | undefined): string {
  if (!relationship) return '🧑';
  const found = AVATAR_BY_RELATIONSHIP.find((r) => r.match.test(relationship));
  return found?.emoji ?? '🧑';
}

const OPTION_COUNT: Record<Difficulty, number> = { easy: 3, medium: 4, challenging: 5 };

interface Round {
  relationship: string;
  correctName: string;
  options: string[];
  photoUrl?: string;
  greetingAudioUrl?: string;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Common shape both onboarding.people and the Memory[] fallback reduce to. */
interface FaceEntry {
  relationship: string;
  name: string;
  photoUrl?: string;
  greetingAudioUrl?: string;
  weight: number;
}

function buildRounds(memories: Memory[], onboardingPeople: OnboardingPerson[], difficulty: Difficulty): Round[] {
  let entries: FaceEntry[];

  if (onboardingPeople.length > 0) {
    // Richer source: real photo + the elder's own nickname for the person,
    // and "asked for often" people are weighted to appear more frequently.
    entries = onboardingPeople
      .filter((p) => p.relationship && (p.callsBy || p.name))
      .map((p) => ({
        relationship: p.relationship,
        name: p.callsBy || p.name,
        photoUrl: p.photoUrl,
        greetingAudioUrl: p.greetingAudioUrl,
        weight: p.askedForOften ? 2 : 1,
      }));
  } else {
    entries = memories
      .filter((m) => m.category === 'family' && m.relationship)
      .map((m) => ({ relationship: m.relationship!, name: m.title, weight: 1 }));
  }

  if (entries.length === 0) return [];

  // Weighted pool: entries marked "asked for often" get extra copies so
  // they come up more often across rounds, without ever excluding anyone.
  const pool = entries.flatMap((e) => Array(e.weight).fill(e) as FaceEntry[]);
  const allNames = entries.map((e) => e.name);
  const optionCount = Math.min(OPTION_COUNT[difficulty], entries.length);

  const seen = new Set<string>();
  const chosen: FaceEntry[] = [];
  for (const e of shuffle(pool)) {
    if (seen.has(e.name)) continue;
    seen.add(e.name);
    chosen.push(e);
    if (chosen.length >= 4) break;
  }

  return chosen.map((e) => {
    const distractors = shuffle(allNames.filter((n) => n !== e.name)).slice(0, optionCount - 1);
    return {
      relationship: e.relationship,
      correctName: e.name,
      options: shuffle([e.name, ...distractors]),
      photoUrl: e.photoUrl,
      greetingAudioUrl: e.greetingAudioUrl,
    };
  });
}

export default function FamilyFacesGame({ difficulty, memories, onComplete }: Props) {
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
  const greetingAudioRef = useRef<HTMLAudioElement | null>(null);

  if (rounds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>👨‍👩‍👧</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No family memories yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          Ask your caregiver to add a few family members during onboarding or in "My Memories" to unlock this game.
        </p>
      </div>
    );
  }

  const round = rounds[qIdx];

  const handleSelect = (opt: string) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const isCorrect = opt === round.correctName;
    if (isCorrect) setCorrectCount((p) => p + 1);
    else setMistakeCount((p) => p + 1);
    voice.speakFeedback(narrateFeedback(lang, isCorrect));
    if (isCorrect && round.greetingAudioUrl && greetingAudioRef.current) {
      greetingAudioRef.current.src = round.greetingAudioUrl;
      greetingAudioRef.current.play().catch(() => { /* ignore autoplay rejection */ });
    }
  };

  const handleNext = () => {
    if (qIdx < rounds.length - 1) {
      setQIdx((p) => p + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const accuracy = Math.round((correctCount / rounds.length) * 100);
      const rt = (Date.now() - startTime) / 1000;
      onComplete(accuracy, mistakeCount, rt);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Question {qIdx + 1} of {rounds.length}
      </p>

      <QuestionNarrator text={narrateFamilyFacesAsk(lang, round.relationship)} speakKey={qIdx}>
        {round.photoUrl ? (
          <div style={{
            width: 140, height: 140, borderRadius: 24, overflow: 'hidden', margin: '0 auto 16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          }}>
            <img src={round.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{
            fontSize: 100, lineHeight: 1, marginBottom: 16,
            filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))',
          }}>
            {avatarFor(round.relationship)}
          </div>
        )}

        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 28 }}>
          Who is your {round.relationship.toLowerCase()}?
        </h2>
      </QuestionNarrator>
      <audio ref={greetingAudioRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {round.options.map((opt) => {
          let bg = 'white', border = 'var(--border-color)', textColor = 'var(--text-primary)';
          if (answered) {
            if (opt === round.correctName) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; textColor = '#2E7D32'; }
            else if (opt === selected) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; textColor = '#C62828'; }
          } else if (opt === selected) {
            bg = 'rgba(46,125,139,0.08)'; border = 'var(--color-primary)';
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              style={{
                background: bg, border: `3px solid ${border}`, borderRadius: 16,
                padding: '18px 16px', fontSize: 18, fontWeight: 700, color: textColor,
                cursor: 'pointer', transition: 'all 0.15s', minHeight: 64,
              }}
            >
              {answered && opt === round.correctName && '✓ '}{opt}
              {answered && opt === selected && opt !== round.correctName && '✗ '}
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

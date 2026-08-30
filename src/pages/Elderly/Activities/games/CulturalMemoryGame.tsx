import { useMemo, useState } from 'react';
import type { Difficulty, OnboardingCulturalSection } from '../../../../types';
import { useApp } from '../../../../store/AppContext';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateCulturalMemoryAsk, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

interface Question {
  emoji: string;
  name: string;
  options: string[];
  correct: string;
}

// Generic regional bank used when the caregiver hasn't filled in the
// Cultural section yet, so the game still has meaningful content — same
// spirit as RoutineRecallGame's hardcoded fallback.
const FALLBACK_ITEMS: { emoji: string; name: string }[] = [
  { emoji: '🪔', name: 'Bihu' },
  { emoji: '🙏', name: 'Durga Puja' },
  { emoji: '🕯️', name: 'Diwali' },
  { emoji: '🌙', name: 'Eid' },
  { emoji: '🎩', name: 'Jaapi' },
  { emoji: '🥻', name: 'Mekhela Sador' },
  { emoji: '🥁', name: 'Dhol' },
  { emoji: '🧣', name: 'Gamosa' },
];

const EMOJI_BY_KEYWORD: { match: RegExp; emoji: string }[] = [
  { match: /bihu/i, emoji: '🪔' },
  { match: /puja|durga|kali/i, emoji: '🙏' },
  { match: /diwali|deepavali/i, emoji: '🕯️' },
  { match: /eid/i, emoji: '🌙' },
  { match: /jaapi/i, emoji: '🎩' },
  { match: /mekhela|sador|saree|dhoti/i, emoji: '🥻' },
  { match: /dhol|drum/i, emoji: '🥁' },
  { match: /gamosa|scarf|cloth/i, emoji: '🧣' },
];

function emojiFor(name: string): string {
  const found = EMOJI_BY_KEYWORD.find((e) => e.match.test(name));
  return found?.emoji ?? '🎊';
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const OPTION_COUNT: Record<Difficulty, number> = { easy: 3, medium: 4, challenging: 4 };

function buildQuestions(cultural: OnboardingCulturalSection | null | undefined, difficulty: Difficulty): Question[] {
  const personal = [...(cultural?.festivals ?? []), ...(cultural?.traditionalObjects ?? [])]
    .map((s) => s.trim())
    .filter(Boolean);
  const uniquePersonal = Array.from(new Set(personal));

  const fallbackNames = FALLBACK_ITEMS.map((f) => f.name);
  const source = uniquePersonal.length > 0 ? uniquePersonal : fallbackNames;
  const optionCount = Math.min(OPTION_COUNT[difficulty], source.length);
  const rounds = shuffle(source).slice(0, Math.min(4, source.length));

  // Distractors are drawn from the fallback bank so a caregiver who only
  // entered one or two items still gets a full multiple-choice question.
  const distractorPool = Array.from(new Set([...fallbackNames, ...source]));

  return rounds.map((name) => {
    const distractors = shuffle(distractorPool.filter((n) => n !== name)).slice(0, optionCount - 1);
    return {
      emoji: emojiFor(name),
      name,
      correct: name,
      options: shuffle([name, ...distractors]),
    };
  });
}

export default function CulturalMemoryGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const { currentPatient } = useApp();
  const cultural = currentPatient?.preferences?.onboarding?.cultural;
  const questions = useMemo(() => buildQuestions(cultural, difficulty), [cultural, difficulty]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [startTime] = useState(Date.now());

  if (questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎊</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No cultural memories yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          Ask your caregiver to add festivals and traditional objects during onboarding to unlock this game.
        </p>
      </div>
    );
  }

  const q = questions[qIdx];

  const handleSelect = (opt: string) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const isCorrect = opt === q.correct;
    if (isCorrect) setCorrectCount((p) => p + 1);
    else setMistakeCount((p) => p + 1);
    voice.speakFeedback(narrateFeedback(lang, isCorrect));
  };

  const handleNext = () => {
    if (qIdx < questions.length - 1) {
      setQIdx((p) => p + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const accuracy = Math.round((correctCount / questions.length) * 100);
      const rt = (Date.now() - startTime) / 1000;
      onComplete(accuracy, mistakeCount, rt);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Question {qIdx + 1} of {questions.length}
      </p>

      <QuestionNarrator text={narrateCulturalMemoryAsk(lang)} speakKey={qIdx}>
        <div style={{
          fontSize: 100, lineHeight: 1, marginBottom: 16,
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))',
        }}>
          {q.emoji}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 28 }}>
          Which one of these is familiar to you?
        </h2>
      </QuestionNarrator>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {q.options.map((opt) => {
          let bg = 'white', border = 'var(--border-color)', textColor = 'var(--text-primary)';
          if (answered) {
            if (opt === q.correct) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; textColor = '#2E7D32'; }
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
              {answered && opt === q.correct && '✓ '}{opt}
              {answered && opt === selected && opt !== q.correct && '✗ '}
            </button>
          );
        })}
      </div>

      {answered && (
        <div>
          <div style={{
            background: selected === q.correct ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            color: selected === q.correct ? '#2E7D32' : '#C62828', fontWeight: 600, fontSize: 16,
          }}>
            {selected === q.correct ? '✓ Correct!' : `✗ It was ${q.correct}`}
          </div>
          <button
            className="btn btn--primary"
            onClick={handleNext}
            style={{ width: '100%', height: 56, fontSize: 18, borderRadius: 16 }}
          >
            {qIdx < questions.length - 1 ? 'Next Question →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}

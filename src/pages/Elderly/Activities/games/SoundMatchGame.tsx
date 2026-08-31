import { useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateSoundMatch, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

interface WordEntry {
  word: string;
  emoji: string;
}

// Audio-first, low-cognitive-load: the word is only ever spoken aloud, never
// shown as text, so the task is purely "listen and match a picture" — a
// different sensory channel than every other (visual-only) recognition game.
const WORDS: WordEntry[] = [
  { word: 'Cup', emoji: '🍵' }, { word: 'Umbrella', emoji: '☂️' }, { word: 'Basket', emoji: '🧺' },
  { word: 'Lamp', emoji: '🪔' }, { word: 'Pot', emoji: '🏺' }, { word: 'Flower', emoji: '🌸' },
  { word: 'Fish', emoji: '🐟' }, { word: 'Coconut', emoji: '🥥' },
];

const OPTION_COUNT: Record<Difficulty, number> = { easy: 3, medium: 3, challenging: 4 };
const ROUND_COUNT = 4;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildRounds(difficulty: Difficulty): { correct: WordEntry; options: WordEntry[] }[] {
  const optionCount = OPTION_COUNT[difficulty];
  const chosen = shuffle(WORDS).slice(0, ROUND_COUNT);
  return chosen.map((correct) => {
    const distractors = shuffle(WORDS.filter((w) => w.word !== correct.word)).slice(0, optionCount - 1);
    return { correct, options: shuffle([correct, ...distractors]) };
  });
}

export default function SoundMatchGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const [rounds] = useState(() => buildRounds(difficulty));
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [startTime] = useState(Date.now());

  const round = rounds[qIdx];

  const handleSelect = (opt: WordEntry) => {
    if (answered) return;
    setSelected(opt.word);
    setAnswered(true);
    const isCorrect = opt.word === round.correct.word;
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
        Sound {qIdx + 1} of {rounds.length}
      </p>

      {/* Speaks the instruction + round.correct.word — the only place the answer appears, keeping this audio-first. */}
      <QuestionNarrator text={`${narrateSoundMatch(lang)} ${round.correct.word}.`} speakKey={qIdx}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🔔</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: 'var(--text-secondary)' }}>
          Listen, then tap the matching picture
        </h2>
      </QuestionNarrator>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${Math.min(round.options.length, 3)}, 1fr)`,
        gap: 12, marginBottom: 20,
      }}>
        {round.options.map((opt) => {
          const isCorrectOpt = opt.word === round.correct.word;
          let border = 'var(--border-color)', bg = 'white';
          if (answered) {
            if (isCorrectOpt) { border = 'var(--color-success)'; bg = 'var(--color-success-light)'; }
            else if (opt.word === selected) { border = 'var(--color-danger)'; bg = 'var(--color-danger-light)'; }
          } else if (opt.word === selected) {
            border = 'var(--color-primary)'; bg = 'rgba(46,125,139,0.08)';
          }
          return (
            <button
              key={opt.word}
              onClick={() => handleSelect(opt)}
              style={{
                background: bg, border: `3px solid ${border}`, borderRadius: 18,
                padding: '20px 8px', cursor: answered ? 'default' : 'pointer',
                fontSize: 44, transition: 'all 0.15s',
              }}
            >
              {opt.emoji}
            </button>
          );
        })}
      </div>

      {answered && (
        <div>
          <div style={{
            background: selected === round.correct.word ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            color: selected === round.correct.word ? '#2E7D32' : '#C62828', fontWeight: 600, fontSize: 16,
          }}>
            {selected === round.correct.word ? '✓ That\'s right!' : `That was ${round.correct.word}.`}
          </div>
          <button
            className="btn btn--primary"
            onClick={handleNext}
            style={{ width: '100%', height: 56, fontSize: 18, borderRadius: 16 }}
          >
            {qIdx < rounds.length - 1 ? 'Next Sound →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}

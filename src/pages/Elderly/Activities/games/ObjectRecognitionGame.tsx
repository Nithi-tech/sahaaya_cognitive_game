import { useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateObjectRecognition, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

const QUESTIONS: Record<Difficulty, { emoji: string; name: string; options: string[]; correct: string }[]> = {
  easy: [
    { emoji: '🧺', name: 'Bamboo Basket', options: ['Basket', 'Chair', 'Cup', 'Book'], correct: 'Basket' },
    { emoji: '🍵', name: 'Tea Cup', options: ['Bowl', 'Tea Cup', 'Bottle', 'Plate'], correct: 'Tea Cup' },
    { emoji: '🎋', name: 'Bamboo', options: ['Tree', 'Flower', 'Bamboo', 'Grass'], correct: 'Bamboo' },
    { emoji: '🌸', name: 'Flower', options: ['Leaf', 'Fruit', 'Flower', 'Plant'], correct: 'Flower' },
  ],
  medium: [
    { emoji: '🪔', name: 'Oil Lamp', options: ['Candle', 'Torch', 'Oil Lamp', 'Bulb'], correct: 'Oil Lamp' },
    { emoji: '🏺', name: 'Clay Pot', options: ['Jug', 'Clay Pot', 'Bucket', 'Bowl'], correct: 'Clay Pot' },
    { emoji: '🪷', name: 'Lotus', options: ['Rose', 'Lotus', 'Marigold', 'Lily'], correct: 'Lotus' },
    { emoji: '🥥', name: 'Coconut', options: ['Coconut', 'Mango', 'Lemon', 'Guava'], correct: 'Coconut' },
  ],
  challenging: [
    { emoji: '🦏', name: 'One-Horned Rhino', options: ['Buffalo', 'Elephant', 'One-Horned Rhino', 'Hippo'], correct: 'One-Horned Rhino' },
    { emoji: '🥻', name: 'Mekhela Sador', options: ['Saree', 'Mekhela Sador', 'Dupatta', 'Kurta'], correct: 'Mekhela Sador' },
    { emoji: '☂️', name: 'Umbrella', options: ['Hat', 'Umbrella', 'Fan', 'Coat'], correct: 'Umbrella' },
    { emoji: '🪴', name: 'Potted Plant', options: ['Potted Plant', 'Bonsai', 'Cactus', 'Fern'], correct: 'Potted Plant' },
  ],
};

export default function ObjectRecognitionGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const questions = QUESTIONS[difficulty];
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [startTime] = useState(Date.now());

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

      <QuestionNarrator text={narrateObjectRecognition(lang)} speakKey={qIdx}>
        <div style={{
          fontSize: 110, lineHeight: 1, marginBottom: 16,
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))',
        }}>
          {q.emoji}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 28 }}>What is this?</h2>
      </QuestionNarrator>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {q.options.map((opt) => {
          let bg = 'white', border = 'var(--border-color)', textColor = 'var(--text-primary)';
          if (answered) {
            if (opt === q.correct) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; textColor = 'var(--color-success-text)'; }
            else if (opt === selected) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; textColor = 'var(--color-danger-text)'; }
          } else if (opt === selected) {
            bg = 'rgba(109,66,245,0.08)'; border = 'var(--color-primary)';
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              style={{
                background: bg, border: `3px solid ${border}`, borderRadius: 16,
                padding: '20px 12px', fontSize: 17, fontWeight: 700, color: textColor,
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
            color: selected === q.correct ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontWeight: 600, fontSize: 16,
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

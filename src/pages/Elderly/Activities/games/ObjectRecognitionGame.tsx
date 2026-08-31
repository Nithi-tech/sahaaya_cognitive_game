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
      {/* Progress Bar & Counter Pill */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#F1F5F9',
          padding: '4px 14px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          color: '#475569',
          marginBottom: 10,
        }}>
          <span>Question {qIdx + 1} of {questions.length}</span>
        </div>
        <div style={{
          width: '100%',
          height: 6,
          background: '#E2E8F0',
          borderRadius: 999,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${((qIdx + (answered ? 1 : 0)) / questions.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0284C7 0%, #10B981 100%)',
            borderRadius: 999,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <QuestionNarrator text={narrateObjectRecognition(lang)} speakKey={qIdx}>
        {/* Soft Framed Mascot / Item Card */}
        <div style={{
          width: 140,
          height: 140,
          margin: '0 auto 18px',
          borderRadius: 32,
          background: 'radial-gradient(circle at 35% 30%, #F8FAFC 0%, #E2E8F0 100%)',
          border: '3px solid #CBD5E1',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 72, lineHeight: 1, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))' }}>
            {q.emoji}
          </span>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
          What is this?
        </h2>
      </QuestionNarrator>

      {/* Senior-Friendly Tactile Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {q.options.map((opt) => {
          let bg = '#FFFFFF', border = '#CBD5E1', textColor = '#1E293B', shadow = '0 3px 8px rgba(0,0,0,0.04)';
          if (answered) {
            if (opt === q.correct) {
              bg = '#DCFCE7';
              border = '#16A34A';
              textColor = '#15803D';
              shadow = '0 4px 14px rgba(22, 163, 74, 0.25)';
            } else if (opt === selected) {
              bg = '#FEE2E2';
              border = '#DC2626';
              textColor = '#B91C1C';
            }
          } else if (opt === selected) {
            bg = '#F0F9FF';
            border = '#0284C7';
            textColor = '#0369A1';
            shadow = '0 4px 14px rgba(2, 132, 199, 0.2)';
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={answered}
              style={{
                background: bg,
                border: `3px solid ${border}`,
                borderRadius: 20,
                padding: '18px 12px',
                fontSize: 19,
                fontWeight: 700,
                color: textColor,
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                minHeight: 68,
                boxShadow: shadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {answered && opt === q.correct && <span style={{ fontSize: 20 }}>✓</span>}
              {answered && opt === selected && opt !== q.correct && <span style={{ fontSize: 20 }}>✗</span>}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback & Next Action */}
      {answered && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{
            background: selected === q.correct ? '#DCFCE7' : '#FEF3C7',
            border: `2px solid ${selected === q.correct ? '#86EFAC' : '#FDE68A'}`,
            borderRadius: 16,
            padding: '14px 18px',
            marginBottom: 16,
            color: selected === q.correct ? '#15803D' : '#B45309',
            fontWeight: 700,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <span>{selected === q.correct ? '🎉' : '💡'}</span>
            <span>{selected === q.correct ? 'Wonderful! That is correct!' : `Good try! That is a ${q.correct}`}</span>
          </div>

          <button
            onClick={handleNext}
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
            <span>{qIdx < questions.length - 1 ? 'Next Question →' : 'See Results 🏆'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

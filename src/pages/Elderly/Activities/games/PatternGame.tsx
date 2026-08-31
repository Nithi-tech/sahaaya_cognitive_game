import { useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narratePattern, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

interface PatternQuestion {
  sequence: string[];
  options: string[];
  correct: string;
}

const QUESTIONS: Record<Difficulty, PatternQuestion[]> = {
  easy: [
    { sequence: ['●', '▲', '●', '▲', '?'], options: ['●', '■', '▲', '★'], correct: '●' },
    { sequence: ['■', '■', '●', '■', '■', '?'], options: ['■', '●', '▲', '★'], correct: '●' },
    { sequence: ['▲', '●', '▲', '●', '?'], options: ['▲', '■', '★', '◆'], correct: '▲' },
  ],
  medium: [
    { sequence: ['●', '●', '▲', '●', '●', '?'], options: ['▲', '●', '■', '★'], correct: '▲' },
    { sequence: ['■', '▲', '★', '■', '▲', '?'], options: ['■', '▲', '★', '●'], correct: '★' },
    { sequence: ['◆', '●', '◆', '●', '◆', '?'], options: ['◆', '●', '▲', '■'], correct: '●' },
  ],
  challenging: [
    { sequence: ['●', '▲', '■', '●', '▲', '?'], options: ['■', '▲', '●', '★'], correct: '■' },
    { sequence: ['★', '◆', '★', '◆', '★', '?'], options: ['●', '◆', '★', '■'], correct: '◆' },
    { sequence: ['▲', '▲', '●', '▲', '▲', '?'], options: ['▲', '●', '■', '◆'], correct: '●' },
  ],
};

const SHAPE_COLORS: Record<string, string> = {
  '●': '#2E7D8B', '▲': '#E8A63A', '■': '#E91E63', '★': '#9C27B0', '◆': '#4CAF50',
};

export default function PatternGame({ difficulty, onComplete }: Props) {
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
      onComplete(accuracy, mistakeCount, (Date.now() - startTime) / 1000);
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

      <QuestionNarrator text={narratePattern(lang)} speakKey={qIdx}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          What comes next?
        </h2>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 22, fontWeight: 500 }}>
          Look at the shapes and complete the pattern:
        </p>

        {/* Pattern Sequence Arena */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 28,
          background: 'radial-gradient(circle at 50% 50%, #F8FAFC 0%, #EFF6FF 100%)',
          borderRadius: 24,
          padding: '22px 16px',
          border: '2px solid #E2E8F0',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        }}>
          {q.sequence.map((item, i) => (
            <div key={i} style={{
              width: 62,
              height: 62,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: item === '?' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : '#FFFFFF',
              borderRadius: 18,
              border: item === '?' ? 'none' : '3px solid #CBD5E1',
              boxShadow: item === '?' ? '0 6px 18px rgba(2, 132, 199, 0.35)' : '0 4px 10px rgba(0,0,0,0.05)',
            }}>
              {item === '?' ? (
                <span style={{ color: 'white', fontSize: 26, fontWeight: 900 }}>?</span>
              ) : (
                <span style={{ fontSize: 32, color: SHAPE_COLORS[item] ?? '#1E293B', fontWeight: 800 }}>{item}</span>
              )}
            </div>
          ))}
        </div>
      </QuestionNarrator>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {q.options.map((opt) => {
          let bg = '#FFFFFF', border = '#CBD5E1', shadow = '0 4px 10px rgba(0,0,0,0.04)';
          if (answered) {
            if (opt === q.correct) {
              bg = '#DCFCE7';
              border = '#16A34A';
              shadow = '0 4px 14px rgba(22, 163, 74, 0.25)';
            } else if (opt === selected) {
              bg = '#FEE2E2';
              border = '#DC2626';
            }
          } else if (opt === selected) {
            bg = '#F0F9FF';
            border = '#0284C7';
            shadow = '0 4px 14px rgba(2, 132, 199, 0.25)';
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
                padding: '18px 8px',
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                fontSize: 34,
                fontWeight: 800,
                color: SHAPE_COLORS[opt] ?? '#1E293B',
                minHeight: 74,
                boxShadow: shadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

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
            <span>{selected === q.correct ? 'Brilliant! Correct pattern!' : `Good try! The next shape was ${q.correct}`}</span>
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
            <span>{qIdx < questions.length - 1 ? 'Next Pattern →' : 'See Results 🏆'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

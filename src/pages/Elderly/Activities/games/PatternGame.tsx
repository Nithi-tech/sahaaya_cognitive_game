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
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Question {qIdx + 1} of {questions.length}
      </p>

      <QuestionNarrator text={narratePattern(lang)} speakKey={qIdx}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>What comes next?</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Complete the pattern
        </p>

        {/* Pattern Sequence */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginBottom: 32,
          background: '#F8FAFB', borderRadius: 20, padding: '20px',
          border: '2px solid var(--border-color)',
        }}>
          {q.sequence.map((item, i) => (
            <div key={i} style={{
              width: 52, height: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: item === '?' ? 'var(--color-primary)' : 'white',
              borderRadius: 12,
              border: item === '?' ? 'none' : '2px solid var(--border-color)',
              boxShadow: item === '?' ? 'var(--shadow-md)' : 'none',
            }}>
              {item === '?' ? (
                <span style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>?</span>
              ) : (
                <span style={{ fontSize: 28, color: SHAPE_COLORS[item] ?? '#333', fontWeight: 700 }}>{item}</span>
              )}
            </div>
          ))}
        </div>
      </QuestionNarrator>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {q.options.map((opt) => {
          let bg = 'white', border = 'var(--border-color)';
          if (answered) {
            if (opt === q.correct) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; }
            else if (opt === selected) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; }
          } else if (opt === selected) {
            bg = 'rgba(46,125,139,0.1)'; border = 'var(--color-primary)';
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              style={{
                background: bg, border: `3px solid ${border}`,
                borderRadius: 16, padding: '20px 8px',
                cursor: 'pointer', transition: 'all 0.15s',
                fontSize: 32, fontWeight: 700,
                color: SHAPE_COLORS[opt] ?? '#333',
              }}
            >
              {opt}
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
            {selected === q.correct ? '✓ Correct!' : `✗ The answer was ${q.correct}`}
          </div>
          <button
            className="btn btn--primary"
            onClick={handleNext}
            style={{ width: '100%', height: 56, fontSize: 18, borderRadius: 16 }}
          >
            {qIdx < questions.length - 1 ? 'Next →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}

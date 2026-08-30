import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateBlockMemory, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// A Simon-says-style spatial sequence: watch a growing sequence of blocks
// light up, then repeat it by tapping. Unlike the reference (which grows the
// sequence indefinitely until a mistake), this has one fixed target length
// per difficulty and ends supportively at the first slip — "you remembered
// N blocks" always reads as an achievement, never a failure count.
const TARGET_LENGTH: Record<Difficulty, number> = { easy: 3, medium: 4, challenging: 5 };
const BLOCK_COUNT = 9;
const STEP_MS = 750;

function buildSequence(length: number): number[] {
  const seq: number[] = [];
  while (seq.length < length) {
    let next = Math.floor(Math.random() * BLOCK_COUNT);
    if (seq.length > 0 && next === seq[seq.length - 1]) next = (next + 1) % BLOCK_COUNT;
    seq.push(next);
  }
  return seq;
}

type Phase = 'watch' | 'recall' | 'done';

export default function BlockMemoryGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const target = TARGET_LENGTH[difficulty];
  const [sequence] = useState(() => buildSequence(target));
  const [phase, setPhase] = useState<Phase>('watch');
  const [litIdx, setLitIdx] = useState(-1);
  const [userIdx, setUserIdx] = useState(0);
  const [wrongBlock, setWrongBlock] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const watchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let step = 0;
    const playStep = () => {
      if (step >= sequence.length) {
        setLitIdx(-1);
        setPhase('recall');
        return;
      }
      setLitIdx(sequence[step]);
      watchTimer.current = setTimeout(() => {
        setLitIdx(-1);
        watchTimer.current = setTimeout(() => {
          step += 1;
          playStep();
        }, 200);
      }, STEP_MS);
    };
    const startDelay = setTimeout(playStep, 900);
    return () => {
      clearTimeout(startDelay);
      if (watchTimer.current) clearTimeout(watchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (correctCount: number, mistake: boolean) => {
    const accuracy = Math.round((correctCount / target) * 100);
    voice.speakFeedback(narrateFeedback(lang, !mistake));
    setPhase('done');
    setTimeout(() => onComplete(accuracy, mistake ? 1 : 0, (Date.now() - startTime) / 1000), 1200);
  };

  const handleBlockTap = (blockId: number) => {
    if (phase !== 'recall') return;
    if (blockId === sequence[userIdx]) {
      const nextIdx = userIdx + 1;
      if (nextIdx >= sequence.length) {
        finish(sequence.length, false);
      } else {
        setUserIdx(nextIdx);
      }
    } else {
      setWrongBlock(blockId);
      setTimeout(() => setWrongBlock(null), 400);
      finish(userIdx, true);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <QuestionNarrator text={narrateBlockMemory(lang)} speakKey="block-memory-instruction">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
          {phase === 'watch' ? 'Watch carefully' : phase === 'recall' ? 'Now repeat it' : 'Great effort'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {phase === 'recall' ? `Block ${userIdx + 1} of ${sequence.length}` : `${sequence.length} blocks to remember`}
        </p>
      </QuestionNarrator>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        maxWidth: 280, margin: '0 auto',
      }}>
        {Array.from({ length: BLOCK_COUNT }, (_, i) => {
          const isLit = litIdx === i;
          const isWrong = wrongBlock === i;
          return (
            <button
              key={i}
              onClick={() => handleBlockTap(i)}
              disabled={phase !== 'recall'}
              style={{
                aspectRatio: '1', borderRadius: 16, border: 'none',
                background: isWrong ? 'var(--color-danger)' : isLit ? 'var(--color-primary)' : 'var(--border-color)',
                boxShadow: isLit ? '0 0 0 4px rgba(109,66,245,0.25)' : 'none',
                cursor: phase === 'recall' ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

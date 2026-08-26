import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narrateDualMemory } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// N-Back: watch a sequence of positions (and, at the hardest level, spoken
// letters) light up one at a time; say whether the current one matches the
// one from N steps back. This is genuinely the most cognitively demanding
// activity in the app (marked category: ADVANCED) — kept position-only at
// easy/medium, since even a 1-back dual task is hard for most people the
// first time. The "audio" stimulus is spoken by the shared voice service
// rather than pre-recorded clips, so no audio assets are needed.
//
// Scoring happens exactly once per trial, at interval-expiry, read from refs
// (not React state) — a scheduled setTimeout closure only ever sees the
// state values that existed when it was *created*, so reading state instead
// of a ref here would silently score every trial as "no response," no
// matter how quickly the user actually tapped.
const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R'];
const GRID_SIZE = 9;
const TRIAL_INTERVAL_MS = 3200;
const HIGHLIGHT_MS = 1500;

interface LevelConfig {
  nBack: number;
  trialCount: number;
  dualMode: boolean;
}
const LEVEL: Record<Difficulty, LevelConfig> = {
  easy: { nBack: 1, trialCount: 8, dualMode: false },
  medium: { nBack: 2, trialCount: 10, dualMode: false },
  challenging: { nBack: 1, trialCount: 10, dualMode: true },
};

interface Trial {
  position: number;
  letter: string;
}

function buildTrials(count: number): Trial[] {
  return Array.from({ length: count }, () => ({
    position: Math.floor(Math.random() * GRID_SIZE),
    letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
  }));
}

export default function DualMemoryGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const config = LEVEL[difficulty];
  const [trials] = useState(() => buildTrials(config.trialCount));
  const [trialIdx, setTrialIdx] = useState(0);
  const [litPosition, setLitPosition] = useState(-1);
  const [canRespond, setCanRespond] = useState(false);
  const [positionResponded, setPositionResponded] = useState(false);
  const [audioResponded, setAudioResponded] = useState(false);
  const [startTime] = useState(Date.now());

  const positionRespondedRef = useRef(false);
  const audioRespondedRef = useRef(false);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPositionMatch = (i: number) => i >= config.nBack && trials[i].position === trials[i - config.nBack].position;
  const isAudioMatch = (i: number) => i >= config.nBack && trials[i].letter === trials[i - config.nBack].letter;

  useEffect(() => {
    if (trialIdx >= trials.length) return;

    positionRespondedRef.current = false;
    audioRespondedRef.current = false;
    setPositionResponded(false);
    setAudioResponded(false);
    setCanRespond(true);
    setLitPosition(trials[trialIdx].position);
    if (config.dualMode) voice.speak(trials[trialIdx].letter);

    highlightTimer.current = setTimeout(() => setLitPosition(-1), HIGHLIGHT_MS);

    advanceTimer.current = setTimeout(() => {
      setCanRespond(false);

      // Score this trial exactly once, from the refs (always current).
      if (trialIdx >= config.nBack) {
        const posOk = positionRespondedRef.current === isPositionMatch(trialIdx);
        if (posOk) correctRef.current += 1; else wrongRef.current += 1;
        if (config.dualMode) {
          const audOk = audioRespondedRef.current === isAudioMatch(trialIdx);
          if (audOk) correctRef.current += 1; else wrongRef.current += 1;
        }
      }

      if (trialIdx < trials.length - 1) {
        setTrialIdx((p) => p + 1);
      } else {
        const scored = config.dualMode ? (trials.length - config.nBack) * 2 : trials.length - config.nBack;
        const accuracy = scored > 0 ? Math.round((correctRef.current / scored) * 100) : 100;
        setTimeout(() => onComplete(accuracy, wrongRef.current, (Date.now() - startTime) / 1000), 400);
      }
    }, TRIAL_INTERVAL_MS);

    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialIdx]);

  const respondPosition = () => {
    if (!canRespond || positionRespondedRef.current) return;
    positionRespondedRef.current = true;
    setPositionResponded(true);
  };
  const respondAudio = () => {
    if (!canRespond || audioRespondedRef.current) return;
    audioRespondedRef.current = true;
    setAudioResponded(true);
  };

  const progressPct = Math.round((trialIdx / trials.length) * 100);

  return (
    <div style={{ textAlign: 'center' }}>
      <QuestionNarrator text={narrateDualMemory(lang)} speakKey="dual-memory-instruction">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
          {config.dualMode ? 'Watch and listen' : 'Watch the square'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Does it match {config.nBack} step{config.nBack > 1 ? 's' : ''} back?
        </p>
      </QuestionNarrator>

      <div className="progress-bar" style={{ marginBottom: 20 }}>
        <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        maxWidth: 240, margin: '0 auto 24px',
      }}>
        {Array.from({ length: GRID_SIZE }, (_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: '1', borderRadius: 12,
              background: litPosition === i ? 'var(--color-primary)' : '#E2E8F0',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={respondPosition}
          disabled={!canRespond || positionResponded}
          className={`btn ${positionResponded ? 'btn--outline' : 'btn--primary'}`}
          style={{ height: 60, fontSize: 17, borderRadius: 16, minWidth: 160, gap: 8 }}
        >
          📍 {positionResponded ? 'Marked' : 'Position Match'}
        </button>
        {config.dualMode && (
          <button
            onClick={respondAudio}
            disabled={!canRespond || audioResponded}
            className={`btn ${audioResponded ? 'btn--outline' : 'btn--primary'}`}
            style={{ height: 60, fontSize: 17, borderRadius: 16, minWidth: 160, gap: 8 }}
          >
            🔊 {audioResponded ? 'Marked' : 'Sound Match'}
          </button>
        )}
      </div>
    </div>
  );
}

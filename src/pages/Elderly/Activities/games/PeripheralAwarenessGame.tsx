import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../../../types';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuizVoice } from '../../../../hooks/useQuizVoice';
import { QuestionNarrator } from '../../../../components/Voice/QuestionNarrator';
import { narratePeripheralAwareness, narrateFeedback } from '../../../../services/voice/narration';

interface Props {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
}

// A divided-attention task, adapted (independently reimplemented, not copied
// — see docs/LICENSE_DECISION.md) from the "useful field of view" paradigm:
// a center item flashes briefly alongside one marked position among a ring
// of eight; name the center item, then point to where the mark was. Kept
// gentler than the reference version — no hard time limit on *answering*,
// only on the stimulus flash itself (same "no punitive timers" principle as
// ColorFocusGame) — and plain shapes instead of readable text/letters for
// the distractors, since this is a visual-attention task, not a literacy one.
const VEHICLES = [
  { id: 'car', emoji: '🚗', label: 'Car' },
  { id: 'bus', emoji: '🚌', label: 'Bus' },
  { id: 'taxi', emoji: '🚕', label: 'Taxi' },
  { id: 'truck', emoji: '🚚', label: 'Truck' },
] as const;
type VehicleId = (typeof VEHICLES)[number]['id'];
const VEHICLE_PAIRS: readonly (readonly [VehicleId, VehicleId])[] = [
  ['car', 'truck'],
  ['taxi', 'bus'],
];

const POSITIONS = 8;
const MASK_MS = 150;
const ANSWER_PAUSE_MS = 1000;

interface LevelConfig {
  trialCount: number;
  displayMs: number;
  distractorCount: number;
}
const LEVEL: Record<Difficulty, LevelConfig> = {
  easy: { trialCount: 6, displayMs: 1500, distractorCount: 0 },
  medium: { trialCount: 8, displayMs: 1100, distractorCount: 3 },
  challenging: { trialCount: 8, displayMs: 800, distractorCount: 5 },
};

interface Trial {
  vehicle: VehicleId;
  options: readonly [VehicleId, VehicleId];
  targetPosition: number;
  distractorPositions: number[];
}

function shuffledIndices(exclude: number): number[] {
  const pool = Array.from({ length: POSITIONS }, (_, i) => i).filter((i) => i !== exclude);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function buildTrial(distractorCount: number): Trial {
  const targetPosition = Math.floor(Math.random() * POSITIONS);
  const options = VEHICLE_PAIRS[Math.floor(Math.random() * VEHICLE_PAIRS.length)];
  const vehicle = options[Math.floor(Math.random() * options.length)];
  return {
    vehicle,
    options,
    targetPosition,
    distractorPositions: shuffledIndices(targetPosition).slice(0, distractorCount),
  };
}

function positionStyle(index: number): React.CSSProperties {
  const angle = (index * Math.PI) / 4 - Math.PI / 2;
  return {
    left: `${50 + Math.cos(angle) * 38}%`,
    top: `${50 + Math.sin(angle) * 36}%`,
  };
}

type Phase = 'stimulus' | 'mask' | 'vehicle-answer' | 'location-answer' | 'feedback';

export default function PeripheralAwarenessGame({ difficulty, onComplete }: Props) {
  const { lang } = useTranslation();
  const voice = useQuizVoice();
  const config = LEVEL[difficulty];
  const [trials] = useState(() => Array.from({ length: config.trialCount }, () => buildTrial(config.distractorCount)));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('stimulus');
  const [vehicleCorrect, setVehicleCorrect] = useState<boolean | null>(null);
  const [locationCorrect, setLocationCorrect] = useState<boolean | null>(null);
  const [startTime] = useState(Date.now());
  const fullyCorrectRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trial = trials[idx];

  useEffect(() => {
    setPhase('stimulus');
    setVehicleCorrect(null);
    setLocationCorrect(null);
    timerRef.current = setTimeout(() => {
      setPhase('mask');
      timerRef.current = setTimeout(() => setPhase('vehicle-answer'), MASK_MS);
    }, config.displayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const finishTrial = (vehicleOk: boolean, locationOk: boolean | null) => {
    const fullyCorrect = vehicleOk && locationOk === true;
    if (fullyCorrect) fullyCorrectRef.current += 1;
    setVehicleCorrect(vehicleOk);
    setLocationCorrect(locationOk);
    setPhase('feedback');
    voice.speakFeedback(narrateFeedback(lang, fullyCorrect));

    timerRef.current = setTimeout(() => {
      if (idx < trials.length - 1) {
        setIdx((p) => p + 1);
      } else {
        const accuracy = Math.round((fullyCorrectRef.current / trials.length) * 100);
        onComplete(accuracy, trials.length - fullyCorrectRef.current, (Date.now() - startTime) / 1000);
      }
    }, ANSWER_PAUSE_MS);
  };

  const chooseVehicle = (id: VehicleId) => {
    if (phase !== 'vehicle-answer') return;
    if (id === trial.vehicle) setPhase('location-answer');
    else finishTrial(false, null);
  };

  const chooseLocation = (position: number) => {
    if (phase !== 'location-answer') return;
    finishTrial(true, position === trial.targetPosition);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {idx + 1} of {trials.length}
      </p>

      <QuestionNarrator text={narratePeripheralAwareness(lang)} speakKey="peripheral-awareness-instruction">
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Watch closely</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          What did you see, and where was the star?
        </p>
      </QuestionNarrator>

      <div style={{
        position: 'relative', width: '100%', maxWidth: 320, aspectRatio: '1', margin: '0 auto 20px',
        background: '#F0F4F3', borderRadius: 24, border: '2px solid var(--border-color)', overflow: 'hidden',
      }}>
        {phase === 'stimulus' && (
          <>
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
              width: 64, height: 64, borderRadius: '50%', background: 'white', boxShadow: 'var(--shadow-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
            }}>
              {VEHICLES.find((v) => v.id === trial.vehicle)?.emoji}
            </div>
            <div style={{
              position: 'absolute', ...positionStyle(trial.targetPosition), transform: 'translate(-50%,-50%)',
              width: 36, height: 36, borderRadius: '50%', background: '#FFD54F',
              boxShadow: '0 0 0 6px rgba(255,213,79,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              ⭐
            </div>
            {trial.distractorPositions.map((p) => (
              <div key={p} style={{
                position: 'absolute', ...positionStyle(p), transform: 'translate(-50%,-50%)',
                width: 28, height: 28, borderRadius: '50%', background: '#B0BEC5',
              }} />
            ))}
          </>
        )}

        {phase === 'mask' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-conic-gradient(#DDE3E2 0deg 10deg, #EDF1F0 10deg 20deg)',
          }} />
        )}

        {phase === 'vehicle-answer' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>What did you see?</p>
          </div>
        )}

        {phase === 'location-answer' && (
          <>
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
              fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', width: 90, textAlign: 'center',
            }}>
              Where was the star?
            </div>
            {Array.from({ length: POSITIONS }, (_, i) => (
              <button
                key={i}
                onClick={() => chooseLocation(i)}
                aria-label={`Position ${i + 1}`}
                style={{
                  position: 'absolute', ...positionStyle(i), transform: 'translate(-50%,-50%)',
                  width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--color-primary)',
                  background: 'white', fontWeight: 800, fontSize: 15, color: 'var(--color-primary)', cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            ))}
          </>
        )}

        {phase === 'feedback' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 48 }}>{vehicleCorrect && locationCorrect ? '✓' : '✗'}</span>
          </div>
        )}
      </div>

      {phase === 'vehicle-answer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {trial.options.map((id) => {
            const v = VEHICLES.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                onClick={() => chooseVehicle(id)}
                className="btn btn--outline"
                style={{ height: 72, fontSize: 17, borderRadius: 16, flexDirection: 'column', gap: 4 }}
              >
                <span style={{ fontSize: 28 }}>{v.emoji}</span>
                <span style={{ fontWeight: 700 }}>{v.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {phase === 'feedback' && (
        <p style={{
          fontSize: 15, fontWeight: 600,
          color: vehicleCorrect && locationCorrect ? 'var(--color-success)' : 'var(--text-tertiary)',
        }}>
          {vehicleCorrect && locationCorrect
            ? '✓ Well spotted!'
            : vehicleCorrect === false
              ? `Good try — it was the ${VEHICLES.find((v) => v.id === trial.vehicle)?.label}.`
              : `Close — the star was at position ${trial.targetPosition + 1}.`}
        </p>
      )}
    </div>
  );
}

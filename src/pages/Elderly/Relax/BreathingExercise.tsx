import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';
import { useApp } from '../../../store/AppContext';
import { QuestionNarrator } from '../../../components/Voice/QuestionNarrator';
import { narrateBreathing } from '../../../services/voice/narration';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';

// A standalone wellness activity — deliberately NOT a GameDefinition entry.
// A breathing exercise has no meaningful "accuracy" or "mistakes"; running
// it through CognitiveGameResult/the adaptive engine would inject fake
// scores into a caregiver's real attention-domain trend chart. So this
// lives outside src/games/ entirely, with its own route and its own
// (unscored) local session log. Reimplemented from the "resonance-breathing
// / box-breathing / 478-breathing" reference — all three source games turn
// out to be the same phase-cycle mechanic with a different preset, so this
// is one screen with a mode picker rather than three near-duplicate games
// (see docs/LICENSE_DECISION.md for why it's reimplemented, not copied).
type Mode = 'resonance' | 'box' | '478';
type Phase = 'idle' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

interface Preset { inhale: number; holdIn: number; exhale: number; holdOut: number }
const PRESETS: Record<Mode, Preset> = {
  resonance: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
  box: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  '478': { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
};
const PHASE_ORDER: Phase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function BreathingExercise() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const { currentPatient } = useApp();
  const emotional = currentPatient?.preferences?.onboarding?.emotional;
  const calmingPhrase = emotional?.phrases?.[0] ?? emotional?.calming;

  const [mode, setMode] = useState<Mode>('resonance');
  const [phase, setPhase] = useState<Phase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const preset = PRESETS[mode];

  const phaseDuration = useCallback((p: Phase): number => {
    switch (p) {
      case 'inhale': return preset.inhale;
      case 'holdIn': return preset.holdIn;
      case 'exhale': return preset.exhale;
      case 'holdOut': return preset.holdOut;
      default: return 0;
    }
  }, [preset]);

  const nextPhase = useCallback((current: Phase): Phase => {
    const idx = PHASE_ORDER.indexOf(current);
    for (let i = 1; i <= 4; i++) {
      const candidate = PHASE_ORDER[(idx + i) % 4];
      if (phaseDuration(candidate) > 0) return candidate;
    }
    return 'inhale';
  }, [phaseDuration]);

  useEffect(() => {
    if (!isRunning) return undefined;
    if (phase === 'idle') { setPhase('inhale'); return undefined; }

    const duration = phaseDuration(phase);
    phaseTimer.current = setTimeout(() => {
      const next = nextPhase(phase);
      if (next === 'inhale') setCycles((c) => c + 1);
      setPhase(next);
    }, duration * 1000);

    return () => { if (phaseTimer.current) clearTimeout(phaseTimer.current); };
  }, [isRunning, phase, phaseDuration, nextPhase]);

  useEffect(() => {
    if (!isRunning) return undefined;
    elapsedTimer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (elapsedTimer.current) clearInterval(elapsedTimer.current); };
  }, [isRunning]);

  useEffect(() => () => {
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    if (elapsedTimer.current) clearInterval(elapsedTimer.current);
  }, []);

  const handleStart = () => { setIsRunning(true); setPhase('inhale'); };
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setPhase('idle');
    setCycles(0);
    setElapsed(0);
  };
  const handleModeChange = (m: Mode) => {
    if (isRunning) return;
    setMode(m);
    handleReset();
  };

  const scale = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.55 : phase === 'holdIn' ? 1 : phase === 'holdOut' ? 0.55 : 0.75;
  const transitionSec = phase === 'inhale' || phase === 'exhale' ? phaseDuration(phase) : 0.3;

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div style={{ padding: '20px 20px 0' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 99, padding: '10px 14px',
            cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={16} /> {t('general.back')}
        </button>

        <QuestionNarrator text={narrateBreathing(lang)} speakKey="breathing-instruction">
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t('relax.title')}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{t('relax.subtitle')}</p>
        </QuestionNarrator>

        {calmingPhrase && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(127,211,199,0.15), rgba(46,125,139,0.1))',
            border: '1.5px solid rgba(46,125,139,0.25)', borderRadius: 16,
            padding: '14px 18px', marginBottom: 20, textAlign: 'center',
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              💬 {calmingPhrase}
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {(['resonance', 'box', '478'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              disabled={isRunning}
              className={`btn btn--sm ${mode === m ? 'btn--primary' : 'btn--outline'}`}
              style={{ opacity: isRunning && mode !== m ? 0.5 : 1 }}
            >
              {t(`relax.mode.${m}`)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>{cycles}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('relax.cycles')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>{formatTime(elapsed)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('relax.elapsed')}</div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 260, marginBottom: 32,
        }}>
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #7FD3C7, var(--color-primary))',
            transform: `scale(${scale})`,
            transition: `transform ${transitionSec}s ease-in-out`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(46,125,139,0.25)',
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 18, textAlign: 'center', padding: 12 }}>
              {phase === 'idle' ? t('relax.start') : t(`relax.phase.${phase}`)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!isRunning ? (
            <button className="btn btn--primary" onClick={handleStart} style={{ height: 56, fontSize: 17, borderRadius: 16, minWidth: 160, gap: 8 }}>
              <Play size={18} /> {t('relax.start')}
            </button>
          ) : (
            <button className="btn btn--primary" onClick={handlePause} style={{ height: 56, fontSize: 17, borderRadius: 16, minWidth: 160, gap: 8 }}>
              <Pause size={18} /> {t('relax.pause')}
            </button>
          )}
          <button className="btn btn--outline" onClick={handleReset} style={{ height: 56, fontSize: 17, borderRadius: 16, gap: 8 }}>
            <RotateCcw size={18} /> {t('relax.reset')}
          </button>
        </div>

        {cycles >= 5 && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('relax.done')}
          </p>
        )}
      </div>

      <ElderlyNav />
    </div>
  );
}

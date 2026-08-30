import type { ReactNode } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { ScoreRing } from '../Charts/Charts';
import type { CognitiveGameResult } from '../../games/types';

interface Action {
  label: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'outline';
}

interface Props {
  result: CognitiveGameResult;
  difficultyReason: string;
  primaryAction: Action;
  secondaryAction?: Action;
}

/**
 * The stats + AI-adjustment result card every "play a game" entry point
 * shows after a session — shared so the copy/behavior can't drift between
 * entry points (see useGameSession.ts for why this got extracted).
 */
export function GameResultScreen({ result, difficultyReason, primaryAction, secondaryAction }: Props) {
  const { t } = useTranslation();
  const improved = result.accuracy >= 80;
  const maintained = result.accuracy >= 50;

  return (
    <div className="elderly-layout" style={{ padding: '40px 20px 60px' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {improved && (
            <div className="confetti-burst">
              {['🎉', '⭐', '🎊', '✨', '🌟', '🎈'].map((e, i) => (
                <span key={i} className="confetti-piece" style={{ ['--i' as string]: i }}>{e}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounce-in 0.5s ease' }}>
            {improved ? '🌟' : maintained ? '👍' : '💪'}
          </div>
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{t('game.great_work')}</h2>

        <div className="card result-card">
          <ScoreRing
            score={result.accuracy}
            size={110}
            color={improved ? 'var(--color-success)' : maintained ? 'var(--color-primary)' : 'var(--color-accent)'}
            label="ACCURACY"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, margin: '20px 0 16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-accent)' }}>{result.mistakes}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>MISTAKES</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-success)' }}>
                {Math.round(result.responseTime)}s
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>TIME</div>
            </div>
          </div>

          <div style={{
            background: '#F8FAFB', borderRadius: 12, padding: '12px 16px',
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
              🤖 AI Adjustment
            </div>
            {difficultyReason}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="btn btn--primary"
            onClick={primaryAction.onClick}
            style={{ height: 64, fontSize: 20, borderRadius: 18, fontWeight: 800 }}
          >
            {primaryAction.label}
          </button>
          {secondaryAction && (
            <button
              className="btn btn--outline"
              onClick={secondaryAction.onClick}
              style={{ height: 52, fontSize: 16 }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

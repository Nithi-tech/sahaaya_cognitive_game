import type { ReactNode } from 'react';
import { ElderlyNav } from '../ElderlyNav/ElderlyNav';
import { useTranslation } from '../../i18n/useTranslation';
import { useApp } from '../../store/AppContext';
import { DOMAIN_META } from '../../games/categoryMeta';
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

const CONFETTI_GREAT = ['🎉', '⭐', '🎊', '✨', '🌟', '🎈'];
const CONFETTI_GOOD = ['✨', '🌟', '👍'];

/**
 * The stats + AI-adjustment result card every "play a game" entry point
 * shows after a session — shared so the copy/behavior can't drift between
 * entry points (see useGameSession.ts for why this got extracted).
 */
export function GameResultScreen({ result, difficultyReason, primaryAction, secondaryAction }: Props) {
  const { t } = useTranslation();
  const { currentPatient } = useApp();
  // Three-way celebration tier — everyone leaves with some positive motion,
  // not just the top scorers.
  const tier: 'great' | 'good' | 'keep-practicing' =
    result.accuracy >= 80 ? 'great' : result.accuracy >= 50 ? 'good' : 'keep-practicing';
  const favoriteColour = currentPatient?.preferences?.onboarding?.favorites?.colour;
  const domainMeta = DOMAIN_META[result.domain];
  const confettiEmojis = tier === 'great' ? CONFETTI_GREAT : tier === 'good' ? CONFETTI_GOOD : [];

  return (
    <div className="elderly-layout" style={{ padding: '40px 20px 90px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {confettiEmojis.length > 0 && (
            <div className="confetti-burst">
              {confettiEmojis.map((e, i) => (
                <span key={i} className="confetti-piece" style={{ ['--i' as string]: i }}>{e}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounce-in 0.5s ease' }}>
            {tier === 'great' ? '🌟' : tier === 'good' ? '👍' : '💪'}
          </div>
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>{t('game.great_work')}</h2>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
          background: `${domainMeta.color}18`, color: domainMeta.color,
          borderRadius: 99, padding: '4px 12px', fontSize: 13, fontWeight: 700,
        }}>
          {domainMeta.icon} {domainMeta.label}
        </div>

        <div className="card" style={{ borderRadius: 20, marginBottom: 20, padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            <div className="result-stat-tile" style={{ background: `${favoriteColour || '#2E7D8B'}14` }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: favoriteColour || 'var(--color-primary)' }}>{result.accuracy}%</div>
              <div className="result-stat-tile__label">ACCURACY</div>
            </div>
            <div className="result-stat-tile" style={{ background: 'rgba(232,166,58,0.12)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-accent)' }}>{result.mistakes}</div>
              <div className="result-stat-tile__label">MISTAKES</div>
            </div>
            <div className="result-stat-tile" style={{ background: 'var(--color-success-light)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-success)' }}>
                {Math.round(result.responseTime)}s
              </div>
              <div className="result-stat-tile__label">TIME</div>
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
            style={{
              height: 64, fontSize: 20, borderRadius: 18, fontWeight: 800,
              ...(favoriteColour ? { background: favoriteColour, borderColor: favoriteColour } : {}),
            }}
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
      <ElderlyNav />
    </div>
  );
}

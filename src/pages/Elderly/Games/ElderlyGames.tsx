import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { GameShell } from '../../../components/GameShell/GameShell';
import { GameResultScreen } from '../../../components/GameShell/GameResultScreen';
import { useApp } from '../../../store/AppContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { GAME_REGISTRY } from '../../../games/registry';
import { useGameSession } from '../../../hooks/useGameSession';
import type { GameCategory } from '../../../games/types';

// The dedicated "browse everything" hub — a second entry point onto the
// same registry/session pipeline "Today's Activity" uses (see
// useGameSession.ts), organized by category instead of by AI recommendation,
// for a user who'd rather pick for themselves. Every game shown here is a
// real GAME_REGISTRY entry, so "playable" is structural, not a claim: there
// is no such thing as a card in this list that doesn't launch a working game.
const CATEGORY_ORDER: GameCategory[] = ['MEMORY', 'FOCUS', 'REACTION', 'PATTERN', 'ROUTINE', 'GENTLE', 'ADVANCED'];

const CATEGORY_META: Record<GameCategory, { labelKey: string; color: string; icon: string }> = {
  MEMORY: { labelKey: 'game.category.memory', color: '#E91E63', icon: '🧠' },
  FOCUS: { labelKey: 'game.category.focus', color: '#146C6B', icon: '🎯' },
  REACTION: { labelKey: 'game.category.reaction', color: '#C1633A', icon: '⚡' },
  PATTERN: { labelKey: 'game.category.pattern', color: '#9C27B0', icon: '🔷' },
  ROUTINE: { labelKey: 'game.category.routine', color: '#4CAF50', icon: '📅' },
  GENTLE: { labelKey: 'game.category.gentle', color: '#26A69A', icon: '🟢' },
  ADVANCED: { labelKey: 'game.category.advanced', color: '#5C6BC0', icon: '🚀' },
};

export default function ElderlyGames() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { memories } = useApp();
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<GameCategory | null>(null);

  const familyMemoryCount = useMemo(
    () => memories.filter((m) => m.category === 'family' && m.relationship).length,
    [memories],
  );
  const availableGames = useMemo(
    () => GAME_REGISTRY.filter((g) => g.id !== 'family_faces' || familyMemoryCount >= 2),
    [familyMemoryCount],
  );

  const categorized = useMemo(() => {
    const groups = new Map<GameCategory, typeof availableGames>();
    for (const cat of CATEGORY_ORDER) groups.set(cat, []);
    for (const g of availableGames) groups.get(g.category)?.push(g);
    return CATEGORY_ORDER.map((cat) => ({ cat, games: groups.get(cat) ?? [] })).filter((g) => g.games.length > 0);
  }, [availableGames]);

  const session = useGameSession((result) => setPlayedIds((prev) => new Set(prev).add(result.gameId)));

  if (session.screen === 'playing' && session.activeGame) {
    const Component = session.activeGame.component;
    return (
      <GameShell
        gameDefinition={session.activeGame}
        difficultyLabel={session.currentDifficulty.charAt(0).toUpperCase() + session.currentDifficulty.slice(1)}
        progressLabel={`Game ${playedIds.size + 1} today`}
        onExit={session.exit}
        onRestart={session.restart}
      >
        <Component
          key={`${session.activeGame.id}-${session.restartKey}`}
          difficulty={session.currentDifficulty}
          onComplete={session.handleComplete}
          memories={session.memories}
        />
      </GameShell>
    );
  }

  if (session.screen === 'result' && session.lastResult) {
    return (
      <GameResultScreen
        result={session.lastResult}
        difficultyReason={session.difficultyReason}
        primaryAction={{ label: '🎮 Play Another', onClick: session.exit }}
        secondaryAction={{ label: 'Back to Home', onClick: () => navigate('/') }}
      />
    );
  }

  const visibleCategories = activeCategory ? categorized.filter((c) => c.cat === activeCategory) : categorized;

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
        padding: '20px 20px 28px', color: 'white',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 99, padding: '8px 12px',
            color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center',
            gap: 6, fontSize: 14, fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> {t('general.back')}
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>🎮 Games</h1>
        <p style={{ opacity: 0.9, fontSize: 15 }}>
          {availableGames.length} games across {categorized.length} categories — pick anything, all of it works
        </p>
      </div>

      {/* Category quick-filter chips — wraps onto multiple rows instead of
          scrolling horizontally, since a hidden-until-swiped row of chips
          with no scroll affordance made 2 of 7 categories undiscoverable. */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, padding: '16px 20px',
      }}>
        <button
          onClick={() => setActiveCategory(null)}
          className="game-cat-chip"
          style={{
            background: activeCategory === null ? 'var(--color-primary)' : 'white',
            color: activeCategory === null ? 'white' : 'var(--text-secondary)',
            borderColor: activeCategory === null ? 'var(--color-primary)' : 'var(--border-color)',
          }}
        >
          All
        </button>
        {categorized.map(({ cat, games }) => {
          const meta = CATEGORY_META[cat];
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(active ? null : cat)}
              className="game-cat-chip"
              style={{
                background: active ? meta.color : 'white',
                color: active ? 'white' : 'var(--text-secondary)',
                borderColor: active ? meta.color : 'var(--border-color)',
              }}
            >
              {meta.icon} {t(meta.labelKey)} <span style={{ opacity: 0.75 }}>({games.length})</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 20px' }}>
        {visibleCategories.map(({ cat, games }) => {
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 12, background: `${meta.color}1A`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0,
                }}>
                  {meta.icon}
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: meta.color }}>{t(meta.labelKey)}</h2>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>{games.length}</span>
              </div>

              <div className="game-card-grid">
                {games.map((g) => {
                  const played = playedIds.has(g.id);
                  return (
                    <button key={g.id} className="game-card" onClick={() => session.start(g)}>
                      {played && (
                        <span className="game-card__played-badge">
                          <CheckCircle2 size={14} /> Played
                        </span>
                      )}
                      <span
                        className="game-card__emoji"
                        style={{ background: `${meta.color}1A` }}
                      >
                        {g.emoji}
                      </span>
                      <span className="game-card__name">{g.name}</span>
                      <span className="game-card__desc">{g.description}</span>
                      <span className="game-card__meta">~{g.estimatedDuration} min</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ElderlyNav />
    </div>
  );
}

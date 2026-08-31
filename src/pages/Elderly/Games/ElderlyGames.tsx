import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { GameShell } from '../../../components/GameShell/GameShell';
import { GameResultScreen } from '../../../components/GameShell/GameResultScreen';
import { useTranslation } from '../../../i18n/useTranslation';
import { useAvailableGames } from '../../../hooks/useAvailableGames';
import { useGameSession } from '../../../hooks/useGameSession';
import { CATEGORY_ORDER, CATEGORY_META } from '../../../games/categoryMeta';
import type { GameCategory } from '../../../games/types';

// The dedicated "browse everything" hub — a second entry point onto the
// same registry/session pipeline "Today's Activity" uses (see
// useGameSession.ts), organized by category instead of by AI recommendation,
// for a user who'd rather pick for themselves. Every game shown here is a
// real GAME_REGISTRY entry, so "playable" is structural, not a claim: there
// is no such thing as a card in this list that doesn't launch a working game.

export default function ElderlyGames() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { availableGames } = useAvailableGames();
  // Maps gameId -> last accuracy played, so the "Played" badge can show a
  // score instead of just a checkmark. Local-only, nothing persisted here.
  const [playedIds, setPlayedIds] = useState<Map<string, number>>(new Map());
  const [activeCategory, setActiveCategory] = useState<GameCategory | null>(null);

  const categorized = useMemo(() => {
    const groups = new Map<GameCategory, typeof availableGames>();
    for (const cat of CATEGORY_ORDER) groups.set(cat, []);
    for (const g of availableGames) groups.get(g.category)?.push(g);
    return CATEGORY_ORDER.map((cat) => ({ cat, games: groups.get(cat) ?? [] })).filter((g) => g.games.length > 0);
  }, [availableGames]);

  const session = useGameSession((result) =>
    setPlayedIds((prev) => new Map(prev).set(result.gameId, result.accuracy)),
  );

  if (session.screen === 'playing' && session.activeGame) {
    const Component = session.activeGame.component;
    return (
      <GameShell
        gameDefinition={session.activeGame}
        difficultyLabel={session.currentDifficulty.charAt(0).toUpperCase() + session.currentDifficulty.slice(1)}
        difficulty={session.currentDifficulty}
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
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                background: `linear-gradient(90deg, ${meta.color}14 0%, transparent 100%)`,
                borderRadius: 12, padding: '8px 10px', marginLeft: -10,
              }}>
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
                  const lastAccuracy = playedIds.get(g.id);
                  return (
                    <button key={g.id} className="game-card" onClick={() => session.start(g)}>
                      {lastAccuracy !== undefined ? (
                        <span className="game-card__played-badge">
                          <CheckCircle2 size={14} /> {lastAccuracy}%
                        </span>
                      ) : g.isNew ? (
                        <span className="game-card__new-badge">✨ New</span>
                      ) : null}
                      <span
                        className="game-card__emoji game-card__emoji--lg"
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

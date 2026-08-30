import { useMemo, useState } from 'react';
import { CheckCircle2, Flame, Gamepad2, LogOut, Search, Sparkles } from 'lucide-react';
import { GameShell } from '../../../components/GameShell/GameShell';
import { GameResultScreen } from '../../../components/GameShell/GameResultScreen';
import { ScoreRing } from '../../../components/Charts/Charts';
import { useApp } from '../../../store/AppContext';
import { useAuth } from '../../../store/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { GAME_REGISTRY } from '../../../games/registry';
import { useGameSession } from '../../../hooks/useGameSession';
import type { GameCategory } from '../../../games/types';
import type { Language } from '../../../types';

const CATEGORY_ORDER: GameCategory[] = ['MEMORY', 'FOCUS', 'REACTION', 'PATTERN', 'ROUTINE', 'GENTLE', 'ADVANCED'];

const CATEGORY_META: Record<GameCategory, { labelKey: string; color: string; icon: string }> = {
  MEMORY: { labelKey: 'game.category.memory', color: '#FF3D81', icon: '🧠' },
  FOCUS: { labelKey: 'game.category.focus', color: '#6D42F5', icon: '🎯' },
  REACTION: { labelKey: 'game.category.reaction', color: '#FF7A00', icon: '⚡' },
  PATTERN: { labelKey: 'game.category.pattern', color: '#A238FF', icon: '🔷' },
  ROUTINE: { labelKey: 'game.category.routine', color: '#16C784', icon: '📅' },
  GENTLE: { labelKey: 'game.category.gentle', color: '#00BFA6', icon: '🟢' },
  ADVANCED: { labelKey: 'game.category.advanced', color: '#2E5BFF', icon: '🚀' },
};

function computeStreak(sessionDates: Set<string>): number {
  let streak = 0;
  const d = new Date();
  while (sessionDates.has(d.toISOString().split('T')[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * The elderly role's only screen: browse every cognitive game, play one,
 * see the result. Everything else the app used to show this role (Home,
 * My Day, Reminders, Talk, Memory, Voice Settings, Relax) is gone — this
 * is a deliberate scope cut, not an oversight.
 */
export default function ElderlyDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { memories, sessions, cognitiveProfile, language, setLanguage } = useApp();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<GameCategory | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const sessionDates = useMemo(() => new Set(sessions.map((s) => s.timestamp.split('T')[0])), [sessions]);
  const streak = useMemo(() => computeStreak(sessionDates), [sessionDates]);
  const playedTodayIds = useMemo(
    () => new Set(sessions.filter((s) => s.timestamp.startsWith(today)).map((s) => s.gameType)),
    [sessions, today],
  );

  const familyMemoryCount = useMemo(
    () => memories.filter((m) => m.category === 'family' && m.relationship).length,
    [memories],
  );
  const availableGames = useMemo(
    () => GAME_REGISTRY.filter((g) => g.id !== 'family_faces' || familyMemoryCount >= 2),
    [familyMemoryCount],
  );

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableGames;
    return availableGames.filter(
      (g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q),
    );
  }, [availableGames, query]);

  const categorized = useMemo(() => {
    const groups = new Map<GameCategory, typeof searched>();
    for (const cat of CATEGORY_ORDER) groups.set(cat, []);
    for (const g of searched) groups.get(g.category)?.push(g);
    return CATEGORY_ORDER.map((cat) => ({ cat, games: groups.get(cat) ?? [] })).filter((g) => g.games.length > 0);
  }, [searched]);

  const session = useGameSession();

  if (session.screen === 'playing' && session.activeGame) {
    const Component = session.activeGame.component;
    return (
      <GameShell
        gameDefinition={session.activeGame}
        difficultyLabel={session.currentDifficulty.charAt(0).toUpperCase() + session.currentDifficulty.slice(1)}
        progressLabel={`Activity ${playedTodayIds.size + 1} today`}
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
      />
    );
  }

  const firstName = (user?.name ?? '').split(' ')[0] || 'there';
  const visibleCategories = activeCategory ? categorized.filter((c) => c.cat === activeCategory) : categorized;

  return (
    <div className="dash">
      <header className="dash-hero">
        <div className="dash-hero__top">
          <div className="dash-hero__brand">🧠 Sahaaya</div>
          <div className="dash-hero__actions">
            <div className="dash-lang-toggle">
              {([['en', 'EN'], ['as', 'অস']] as [Language, string][]).map(([code, label]) => (
                <button
                  key={code}
                  className={`dash-lang-btn ${language === code ? 'dash-lang-btn--active' : ''}`}
                  onClick={() => setLanguage(code)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="dash-hero__logout" onClick={logout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="dash-hero__greeting">
          <div>
            <div className="dash-hero__hello">Hello,</div>
            <div className="dash-hero__name">{firstName}</div>
          </div>
          <ScoreRing score={cognitiveProfile.overallEngagement} size={76} color="#FFFFFF" label="ENGAGEMENT" />
        </div>

        <div className="dash-stat-row">
          <div className="dash-stat">
            <Flame size={18} />
            <span>{streak} day{streak === 1 ? '' : 's'} streak</span>
          </div>
          <div className="dash-stat">
            <Gamepad2 size={18} />
            <span>{playedTodayIds.size} played today</span>
          </div>
          <div className="dash-stat">
            <Sparkles size={18} />
            <span>{sessions.length} total sessions</span>
          </div>
        </div>
      </header>

      <div className="dash-body">
        <div className="dash-search">
          <Search size={18} />
          <input
            className="dash-search__input"
            placeholder="Search games…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="dash-filters">
          <button
            className="game-cat-chip"
            onClick={() => setActiveCategory(null)}
            style={{
              background: activeCategory === null ? 'var(--color-primary)' : 'white',
              color: activeCategory === null ? 'white' : 'var(--text-secondary)',
              borderColor: activeCategory === null ? 'var(--color-primary)' : 'var(--border-color)',
            }}
          >
            All ({availableGames.length})
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

        {visibleCategories.length === 0 && (
          <div className="dash-empty">No games match "{query}". Try a different search.</div>
        )}

        {visibleCategories.map(({ cat, games }) => {
          const meta = CATEGORY_META[cat];
          return (
            <section key={cat} className="dash-section">
              <div className="dash-section__heading">
                <span className="dash-section__icon" style={{ background: `${meta.color}1A`, color: meta.color }}>
                  {meta.icon}
                </span>
                <h2 style={{ color: meta.color }}>{t(meta.labelKey)}</h2>
                <span className="dash-section__count">{games.length}</span>
              </div>

              <div className="dash-game-grid">
                {games.map((g) => {
                  const played = playedTodayIds.has(g.id);
                  return (
                    <button key={g.id} className="dash-game-card" onClick={() => session.start(g)}>
                      <span className="dash-game-card__accent" style={{ background: meta.color }} />
                      {played && (
                        <span className="dash-game-card__badge">
                          <CheckCircle2 size={13} /> Played today
                        </span>
                      )}
                      <span className="dash-game-card__emoji" style={{ background: `${meta.color}1A` }}>
                        {g.emoji}
                      </span>
                      <span className="dash-game-card__name">{g.name}</span>
                      <span className="dash-game-card__desc">{g.description}</span>
                      <span className="dash-game-card__footer">
                        <span className="dash-game-card__meta">~{g.estimatedDuration} min</span>
                        <span className="dash-game-card__play">Play →</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

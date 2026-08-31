import type { GameStat } from '../../utils/gameAnalytics';
import { groupGameStatsByCategory } from '../../utils/gameAnalytics';
import { TrendIndicator } from './TrendIndicator';
import { EmptyState } from './States';

const CATEGORY_LABELS: Record<string, string> = {
  MEMORY: 'Memory',
  FOCUS: 'Focus & Attention',
  REACTION: 'Reaction',
  PATTERN: 'Pattern',
  ROUTINE: 'Routine',
  GENTLE: 'Gentle Focus',
  ADVANCED: 'Advanced',
  CULTURAL: 'Cultural',
};

export function GameAnalyticsTable({
  stats,
  selectedGameId,
  onSelect,
}: {
  stats: GameStat[];
  selectedGameId: string | null;
  onSelect: (gameId: string) => void;
}) {
  if (stats.length === 0) {
    return <EmptyState title="No activities played yet" description="Games and activities the patient completes will show up here." />;
  }

  const grouped = groupGameStatsByCategory(stats);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {grouped.map(({ category, games }) => (
        <div key={category}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            {CATEGORY_LABELS[category] ?? category}
          </h4>
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Attempts</th>
                  <th>Completion</th>
                  <th>Avg. Accuracy</th>
                  <th>Best Score</th>
                  <th>Avg. Response</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr
                    key={g.gameId}
                    onClick={() => onSelect(g.gameId)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedGameId === g.gameId}
                    aria-label={`View details for ${g.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(g.gameId);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      background: selectedGameId === g.gameId ? 'var(--color-primary-light, rgba(46,125,139,0.08))' : undefined,
                    }}
                  >
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ marginRight: 6 }}>{g.emoji}</span>
                      {g.name}
                    </td>
                    <td>{g.attempts}</td>
                    <td>{g.completionRate !== null ? `${Math.round(g.completionRate)}%` : '—'}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: (g.averageAccuracy ?? 0) >= 70 ? 'var(--color-success)' : 'var(--color-primary)' }}>
                        {g.averageAccuracy !== null ? `${Math.round(g.averageAccuracy)}%` : '—'}
                      </span>
                    </td>
                    <td>{g.bestScore}</td>
                    <td>{g.averageResponseTime !== null ? `${g.averageResponseTime.toFixed(1)}s` : '—'}</td>
                    <td>
                      <TrendIndicator direction={g.trend} size={11} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

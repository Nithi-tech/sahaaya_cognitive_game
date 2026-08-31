import { useState } from 'react';
import type { GameStat } from '../../utils/gameAnalytics';
import { TrendIndicator } from './TrendIndicator';

function compareRow(label: string, a: number | null, b: number | null, unit = '') {
  const better = a !== null && b !== null ? (a > b ? 'a' : a < b ? 'b' : 'tie') : null;
  return (
    <tr key={label}>
      <td style={{ fontWeight: 600 }}>{label}</td>
      <td style={{ fontWeight: better === 'a' ? 800 : 500, color: better === 'a' ? 'var(--color-success)' : undefined }}>
        {a !== null ? `${Math.round(a * 10) / 10}${unit}` : '—'}
      </td>
      <td style={{ fontWeight: better === 'b' ? 800 : 500, color: better === 'b' ? 'var(--color-success)' : undefined }}>
        {b !== null ? `${Math.round(b * 10) / 10}${unit}` : '—'}
      </td>
    </tr>
  );
}

export function GameDetailPanel({ game, allGames }: { game: GameStat; allGames: GameStat[] }) {
  const [compareId, setCompareId] = useState<string>('');
  const compareGame = allGames.find((g) => g.gameId === compareId) ?? null;
  const otherGames = allGames.filter((g) => g.gameId !== game.gameId);

  return (
    <div className="card" style={{ borderRadius: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {game.emoji} {game.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
            {game.attempts} attempt{game.attempts === 1 ? '' : 's'} · Last played{' '}
            {new Date(game.lastPlayed).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        </div>
        <TrendIndicator direction={game.trend} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Current Score', value: game.currentScore },
          { label: 'Best Score', value: game.bestScore },
          { label: 'Avg. Accuracy', value: game.averageAccuracy !== null ? `${Math.round(game.averageAccuracy)}%` : '—' },
          { label: 'Completion', value: game.completionRate !== null ? `${Math.round(game.completionRate)}%` : '—' },
          { label: 'Avg. Response', value: game.averageResponseTime !== null ? `${game.averageResponseTime.toFixed(1)}s` : '—' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-page)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Session History</h4>
      <div className="data-table-scroll" style={{ marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Difficulty</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Response</th>
              <th>Mistakes</th>
            </tr>
          </thead>
          <tbody>
            {game.history
              .slice()
              .reverse()
              .slice(0, 15)
              .map((s) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                    {new Date(s.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className={`badge ${s.difficulty === 'easy' ? 'badge--success' : s.difficulty === 'medium' ? 'badge--info' : 'badge--warning'}`}>
                      {s.difficulty}
                    </span>
                  </td>
                  <td>{s.score}</td>
                  <td style={{ fontWeight: 700 }}>{s.accuracy}%</td>
                  <td>{s.responseTime.toFixed(1)}s</td>
                  <td>{s.mistakes}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Compare with another activity</h4>
      <select
        value={compareId}
        onChange={(e) => setCompareId(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid var(--border-color)',
          marginBottom: compareGame ? 14 : 0,
          fontSize: 14,
        }}
      >
        <option value="">Select an activity to compare…</option>
        {otherGames.map((g) => (
          <option key={g.gameId} value={g.gameId}>
            {g.emoji} {g.name}
          </option>
        ))}
      </select>

      {compareGame && (
        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>{game.name}</th>
                <th>{compareGame.name}</th>
              </tr>
            </thead>
            <tbody>
              {compareRow('Avg. Accuracy', game.averageAccuracy, compareGame.averageAccuracy, '%')}
              {compareRow('Best Score', game.bestScore, compareGame.bestScore)}
              {compareRow('Completion Rate', game.completionRate, compareGame.completionRate, '%')}
              {compareRow('Avg. Response Time', game.averageResponseTime, compareGame.averageResponseTime, 's')}
              {compareRow('Attempts', game.attempts, compareGame.attempts)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

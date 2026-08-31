import type { CognitiveDomain, CognitiveSession, GameType } from '../types';
import type { GameCategory } from '../games/types';
import { GAME_REGISTRY } from '../games/registry';
import { average, completionRate, percentageChange, trendDirection, type TrendDirection } from './analytics';

export interface GameStat {
  gameId: GameType;
  name: string;
  emoji: string;
  category: GameCategory;
  domains: CognitiveDomain[];
  attempts: number;
  completedAttempts: number;
  completionRate: number | null;
  currentScore: number | null;
  averageScore: number | null;
  bestScore: number | null;
  averageAccuracy: number | null;
  bestAccuracy: number | null;
  averageResponseTime: number | null;
  totalMistakes: number;
  improvementPercent: number | null;
  trend: TrendDirection;
  lastPlayed: string;
  history: CognitiveSession[];
}

// Only games that were actually played are returned — an unplayed game has
// no real data to show, so it's simply absent rather than zero-filled.
export function buildGameStats(sessions: CognitiveSession[]): GameStat[] {
  const byGame = new Map<string, CognitiveSession[]>();
  for (const s of sessions) {
    if (!byGame.has(s.gameType)) byGame.set(s.gameType, []);
    byGame.get(s.gameType)!.push(s);
  }

  const stats: GameStat[] = [];
  for (const def of GAME_REGISTRY) {
    const raw = byGame.get(def.id);
    if (!raw || raw.length === 0) continue;
    const gameSessions = raw.slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const accuracies = gameSessions.map((s) => s.accuracy);
    const scores = gameSessions.map((s) => s.score);
    const responseTimes = gameSessions.map((s) => s.responseTime);
    const completed = gameSessions.filter((s) => s.completed);

    const half = Math.floor(accuracies.length / 2);
    const earlierAvg = half > 0 ? average(accuracies.slice(0, half)) : null;
    const recentAvg = half > 0 ? average(accuracies.slice(half)) : null;

    stats.push({
      gameId: def.id as GameType,
      name: def.name,
      emoji: def.emoji,
      category: def.category,
      domains: def.cognitiveDomains,
      attempts: gameSessions.length,
      completedAttempts: completed.length,
      completionRate: completionRate(completed.length, gameSessions.length),
      currentScore: scores[scores.length - 1] ?? null,
      averageScore: average(scores),
      bestScore: Math.max(...scores),
      averageAccuracy: average(accuracies),
      bestAccuracy: Math.max(...accuracies),
      averageResponseTime: average(responseTimes),
      totalMistakes: gameSessions.reduce((a, s) => a + s.mistakes, 0),
      improvementPercent: earlierAvg !== null && recentAvg !== null ? percentageChange(earlierAvg, recentAvg) : null,
      trend: trendDirection(accuracies),
      lastPlayed: gameSessions[gameSessions.length - 1].timestamp,
      history: gameSessions,
    });
  }

  return stats.sort((a, b) => b.attempts - a.attempts);
}

export function groupGameStatsByCategory(stats: GameStat[]): { category: GameCategory; games: GameStat[] }[] {
  const byCategory = new Map<GameCategory, GameStat[]>();
  for (const s of stats) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }
  return [...byCategory.entries()]
    .map(([category, games]) => ({ category, games }))
    .sort((a, b) => b.games.reduce((n, g) => n + g.attempts, 0) - a.games.reduce((n, g) => n + g.attempts, 0));
}

export function findFavoriteGame(stats: GameStat[]): GameStat | null {
  if (!stats.length) return null;
  return stats.reduce((favorite, g) => (g.attempts > favorite.attempts ? g : favorite), stats[0]);
}

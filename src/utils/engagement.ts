import type { CognitiveSession } from '../types';
import { consistency } from './analytics';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export function buildHeatmap(sessions: CognitiveSession[], days: number): HeatmapDay[] {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const day = s.timestamp.split('T')[0];
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const result: HeatmapDay[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    result.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return result;
}

export interface EngagementSummary {
  totalSessions: number;
  activeDaysInRange: number;
  possibleDaysInRange: number;
  consistencyPercent: number | null;
  currentStreak: number;
  longestStreak: number;
  missedDaysInRange: number;
  averageSessionsPerActiveDay: number | null;
  sessionsPerWeek: number | null;
}

export function computeEngagementSummary(sessions: CognitiveSession[], days: number): EngagementSummary {
  const heatmap = buildHeatmap(sessions, days);
  const activeDays = heatmap.filter((d) => d.count > 0).length;
  const possibleDays = heatmap.length;

  let currentStreak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].count > 0) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let run = 0;
  for (const day of heatmap) {
    if (day.count > 0) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  return {
    totalSessions: sessions.length,
    activeDaysInRange: activeDays,
    possibleDaysInRange: possibleDays,
    consistencyPercent: consistency(activeDays, possibleDays),
    currentStreak,
    longestStreak,
    missedDaysInRange: possibleDays - activeDays,
    averageSessionsPerActiveDay: activeDays > 0 ? sessions.length / activeDays : null,
    sessionsPerWeek: possibleDays > 0 ? (sessions.length / possibleDays) * 7 : null,
  };
}

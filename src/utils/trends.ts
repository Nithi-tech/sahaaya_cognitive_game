import type { CognitiveSession, CognitiveDomain, TrendDataPoint } from '../types';

const DOMAINS: CognitiveDomain[] = ['memory', 'attention', 'recognition', 'pattern', 'routine'];

/**
 * Builds a real day-by-day trend from stored sessions (replaces the old
 * randomly-generated demo trend data). Days without a session for a domain
 * carry forward the last known value so the line doesn't drop to zero.
 */
export function buildTrendData(sessions: CognitiveSession[], days: number, seed = 70): TrendDataPoint[] {
  const byDay = new Map<string, CognitiveSession[]>();
  for (const s of sessions) {
    const day = s.timestamp.split('T')[0];
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(s);
  }

  const points: TrendDataPoint[] = [];
  const last: Record<CognitiveDomain, number> = {
    memory: seed, attention: seed, recognition: seed, pattern: seed, routine: seed,
  };

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    const daySessions = byDay.get(key) ?? [];

    for (const domain of DOMAINS) {
      const domainSessions = daySessions.filter((s) => s.domain === domain);
      if (domainSessions.length > 0) {
        last[domain] = Math.round(domainSessions.reduce((a, s) => a + s.accuracy, 0) / domainSessions.length);
      }
    }

    const overall = Math.round(DOMAINS.reduce((a, d) => a + last[d], 0) / DOMAINS.length);
    points.push({ date: key, memory: last.memory, attention: last.attention, recognition: last.recognition, pattern: last.pattern, routine: last.routine, overall });
  }

  return points;
}

import type { CognitiveDomain, CognitiveSession } from '../types';

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient_data';

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Undefined growth from a zero base is not a meaningful percentage — return
// null rather than +Infinity/misleading numbers.
export function percentageChange(from: number, to: number): number | null {
  if (from === 0) return to === 0 ? 0 : null;
  return ((to - from) / Math.abs(from)) * 100;
}

export function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => (i + 1 < window ? null : average(values.slice(i + 1 - window, i + 1))));
}

// Requires a minimum number of chronological data points before calling a
// direction at all — a single point (or two) is not a trend.
export function trendDirection(
  valuesChronological: number[],
  opts: { minSamples?: number; thresholdPercent?: number } = {},
): TrendDirection {
  const { minSamples = 4, thresholdPercent = 5 } = opts;
  if (valuesChronological.length < minSamples) return 'insufficient_data';
  const half = Math.floor(valuesChronological.length / 2);
  const earlierAvg = average(valuesChronological.slice(0, half));
  const recentAvg = average(valuesChronological.slice(half));
  if (earlierAvg === null || recentAvg === null) return 'insufficient_data';
  if (earlierAvg === 0) return recentAvg > 0 ? 'improving' : 'stable';
  const pctChange = ((recentAvg - earlierAvg) / Math.abs(earlierAvg)) * 100;
  if (pctChange > thresholdPercent) return 'improving';
  if (pctChange < -thresholdPercent) return 'declining';
  return 'stable';
}

export function baselineDiff(current: number, baseline: number): { absolute: number; percent: number | null } {
  return { absolute: current - baseline, percent: percentageChange(baseline, current) };
}

export interface PeriodComparison {
  currentAvg: number | null;
  previousAvg: number | null;
  changeAbsolute: number | null;
  changePercent: number | null;
  direction: TrendDirection;
}

export function periodOverPeriod(currentPeriod: number[], previousPeriod: number[]): PeriodComparison {
  const currentAvg = average(currentPeriod);
  const previousAvg = average(previousPeriod);
  const changeAbsolute = currentAvg !== null && previousAvg !== null ? currentAvg - previousAvg : null;
  const changePercent = currentAvg !== null && previousAvg !== null ? percentageChange(previousAvg, currentAvg) : null;
  const direction: TrendDirection =
    currentPeriod.length < 2 || previousPeriod.length < 2
      ? 'insufficient_data'
      : changeAbsolute === null
        ? 'insufficient_data'
        : changeAbsolute > 2
          ? 'improving'
          : changeAbsolute < -2
            ? 'declining'
            : 'stable';
  return { currentAvg, previousAvg, changeAbsolute, changePercent, direction };
}

export function completionRate(completed: number, total: number): number | null {
  if (total <= 0) return null;
  return (completed / total) * 100;
}

export function consistency(activeUnits: number, possibleUnits: number): number | null {
  if (possibleUnits <= 0) return null;
  return (activeUnits / possibleUnits) * 100;
}

export interface DomainAggregate {
  domain: CognitiveDomain;
  count: number;
  current: number | null;
  average: number | null;
  best: number | null;
  worst: number | null;
  changeAbsolute: number | null;
  changePercent: number | null;
  trend: TrendDirection;
  baseline: number | null;
  baselineDiff: { absolute: number; percent: number | null } | null;
}

// "Personal baseline" = average accuracy of the earliest available sessions
// for this domain (not an arbitrary population norm) — preferred per spec
// over population comparisons that Sahaaya has no data to support.
export function computeBaseline(valuesChronological: number[], sampleSize = 5): number | null {
  if (!valuesChronological.length) return null;
  return average(valuesChronological.slice(0, Math.min(sampleSize, valuesChronological.length)));
}

export function computeDomainAggregate(
  sessions: CognitiveSession[],
  domain: CognitiveDomain,
  opts: { minSamplesForTrend?: number } = {},
): DomainAggregate {
  const domainSessions = sessions
    .filter((s) => s.domain === domain)
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const accuracies = domainSessions.map((s) => s.accuracy);

  if (!accuracies.length) {
    return {
      domain,
      count: 0,
      current: null,
      average: null,
      best: null,
      worst: null,
      changeAbsolute: null,
      changePercent: null,
      trend: 'insufficient_data',
      baseline: null,
      baselineDiff: null,
    };
  }

  const half = Math.floor(accuracies.length / 2);
  const earlierAvg = half > 0 ? average(accuracies.slice(0, half)) : null;
  const recentAvg = half > 0 ? average(accuracies.slice(half)) : null;
  const current = accuracies[accuracies.length - 1];
  const baseline = computeBaseline(accuracies);

  return {
    domain,
    count: accuracies.length,
    current,
    average: average(accuracies),
    best: Math.max(...accuracies),
    worst: Math.min(...accuracies),
    changeAbsolute: earlierAvg !== null && recentAvg !== null ? recentAvg - earlierAvg : null,
    changePercent: earlierAvg !== null && recentAvg !== null ? percentageChange(earlierAvg, recentAvg) : null,
    trend: trendDirection(accuracies, opts.minSamplesForTrend ? { minSamples: opts.minSamplesForTrend } : undefined),
    baseline,
    baselineDiff: baseline !== null ? baselineDiff(current, baseline) : null,
  };
}

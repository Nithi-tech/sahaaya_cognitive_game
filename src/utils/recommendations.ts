import type { DomainAggregate } from './analytics';
import type { EngagementSummary } from './engagement';
import type { CognitiveDomain } from '../types';

export interface Recommendation {
  id: string;
  kind: 'insight' | 'activity';
  title: string;
  detail: string;
  domain?: CognitiveDomain;
}

const DOMAIN_LABELS: Record<CognitiveDomain, string> = {
  memory: 'Memory',
  attention: 'Attention',
  recognition: 'Recognition',
  pattern: 'Pattern',
  routine: 'Routine',
};

// Deterministic, rule-based — every recommendation traces to a specific
// computed number, never a guess. Framed as activity suggestions, never as
// medical/clinical decisions (Section 18).
export function generateRecommendations(domainAggregates: DomainAggregate[], engagement: EngagementSummary): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const agg of domainAggregates) {
    if (agg.count === 0) continue;
    const label = DOMAIN_LABELS[agg.domain];
    if (agg.trend === 'declining') {
      recs.push({
        id: `decline-${agg.domain}`,
        kind: 'activity',
        domain: agg.domain,
        title: `Consider more ${label.toLowerCase()} activities`,
        detail: `${label} accuracy has trended down over the recent sessions (${agg.count} tracked). More frequent, shorter ${label.toLowerCase()}-focused sessions may help — not a diagnosis, just an activity suggestion.`,
      });
    } else if (agg.trend === 'improving') {
      recs.push({
        id: `improve-${agg.domain}`,
        kind: 'insight',
        domain: agg.domain,
        title: `${label} activities appear to be working`,
        detail: `${label} performance has trended up recently. Maintaining the current activity mix for this domain looks worthwhile.`,
      });
    }
  }

  if (engagement.consistencyPercent !== null && engagement.consistencyPercent < 50 && engagement.possibleDaysInRange >= 7) {
    recs.push({
      id: 'consistency-low',
      kind: 'activity',
      title: 'Engagement has been inconsistent',
      detail: `Only ${Math.round(engagement.consistencyPercent)}% of days in this period had any activity. A lighter, more frequent schedule (shorter sessions, more often) may be easier to sustain than occasional longer ones.`,
    });
  }

  if (engagement.currentStreak >= 3) {
    recs.push({
      id: 'streak-positive',
      kind: 'insight',
      title: `${engagement.currentStreak}-day active streak`,
      detail: 'The current activity frequency appears to be working well — maintaining this schedule is a reasonable next step.',
    });
  }

  if (engagement.totalSessions < 3) {
    recs.push({
      id: 'insufficient-data',
      kind: 'insight',
      title: 'Not enough activity yet for detailed recommendations',
      detail: 'A few more completed sessions will allow trends and domain-specific suggestions to be calculated reliably.',
    });
  }

  return recs;
}

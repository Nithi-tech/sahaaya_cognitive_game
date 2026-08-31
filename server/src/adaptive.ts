// Ported from src/engines/adaptiveDifficulty.ts so session writes recompute
// the cognitive profile server-side (client no longer owns this state).

export type Difficulty = 'easy' | 'medium' | 'challenging';
export type CognitiveDomain = 'memory' | 'attention' | 'recognition' | 'pattern' | 'routine';

export interface DomainScores {
  memory: number;
  attention: number;
  recognition: number;
  pattern: number;
  routine: number;
}

export function updateDomainScore(currentScore: number, sessionAccuracy: number, weight = 0.3): number {
  const updated = Math.round(currentScore * (1 - weight) + sessionAccuracy * weight);
  return Math.max(0, Math.min(100, updated));
}

const DOMAIN_NAMES: Record<CognitiveDomain, string> = {
  memory: 'Memory Match',
  attention: 'Attention',
  recognition: 'Object Recognition',
  pattern: 'Pattern Recognition',
  routine: 'Daily Routine Recall',
};

export interface AdaptiveRecommendation {
  nextDifficulty: Difficulty;
  nextDomain: CognitiveDomain;
  reason: string;
  insight: string;
}

export interface InsightItem {
  id: string;
  domain?: CognitiveDomain;
  title: string;
  insight: string;
  reason: string;
  action: string;
  type: 'positive' | 'neutral' | 'attention';
}

/**
 * Ported from src/engines/adaptiveDifficulty.ts's generateInsights, but
 * emitting the richer InsightItem shape (src/types/index.ts) instead of a
 * plain string[] — this is the fallback path for POST /api/ai/analyze when
 * no Groq key is configured or the call fails, so the caregiver UI only
 * ever has to render one shape regardless of source.
 */
export function generateInsightItems(
  domainScores: DomainScores,
  trendData: { memory: number; attention: number }[],
): InsightItem[] {
  const insights: InsightItem[] = [];

  if (domainScores.memory < 70) {
    insights.push({
      id: 'memory-low',
      domain: 'memory',
      title: 'Memory Practice',
      insight: 'Memory activity performance could benefit from more practice sessions.',
      reason: `Memory score is currently ${domainScores.memory}%.`,
      action: 'Try a memory-focused activity tomorrow.',
      type: 'attention',
    });
  }
  if (domainScores.attention >= 80) {
    insights.push({
      id: 'attention-strong',
      domain: 'attention',
      title: 'Strong Attention',
      insight: 'Attention activities are being completed consistently with good performance.',
      reason: `Attention score is currently ${domainScores.attention}%.`,
      action: 'Keep the current routine going.',
      type: 'positive',
    });
  }
  if (domainScores.pattern < 70) {
    insights.push({
      id: 'pattern-low',
      domain: 'pattern',
      title: 'Pattern Recognition',
      insight: 'Pattern recognition activities show room for improvement.',
      reason: `Pattern score is currently ${domainScores.pattern}%.`,
      action: 'Try Pattern Recognition or Odd One Out this week.',
      type: 'attention',
    });
  }

  if (trendData.length >= 5) {
    const recent = trendData.slice(-5).map((d) => d.memory);
    const older = trendData.slice(-10, -5).map((d) => d.memory);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg < olderAvg - 3) {
      insights.push({
        id: 'memory-decreasing',
        domain: 'memory',
        title: 'Recent Dip',
        insight: 'Memory activity performance has decreased over the last 5 sessions.',
        reason: `Recent average ${Math.round(recentAvg)}% vs. earlier average ${Math.round(olderAvg)}%.`,
        action: 'Check in about recent changes in routine, sleep, or mood.',
        type: 'attention',
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: 'stable',
      title: 'Steady Progress',
      insight: 'Performance across all cognitive domains is stable.',
      reason: 'No domain is currently below the practice threshold.',
      action: 'No action needed — keep up the current activity mix.',
      type: 'neutral',
    });
  }

  return insights;
}

export function generateRecommendation(
  domainScores: DomainScores,
  recentDomains: CognitiveDomain[],
  sessionAccuracy: number,
): AdaptiveRecommendation {
  const scores = Object.entries(domainScores) as [CognitiveDomain, number][];
  const sortedByScore = scores.sort(([, a], [, b]) => a - b);
  let recommended: CognitiveDomain = sortedByScore[0][0];

  const recentSet = new Set(recentDomains.slice(0, 2));
  for (const [domain] of sortedByScore) {
    if (!recentSet.has(domain)) {
      recommended = domain;
      break;
    }
  }

  const score = domainScores[recommended];

  let insight: string;
  let reason: string;

  if (sessionAccuracy < 60) {
    insight = `The activity was a bit challenging today. Let's try a different type tomorrow.`;
    reason = `Your accuracy was ${sessionAccuracy}% in today's activity.`;
  } else if (sessionAccuracy >= 80) {
    insight = `Wonderful performance today! Time to explore another area.`;
    reason = `You scored ${sessionAccuracy}% accuracy. Great engagement!`;
  } else {
    insight = `Good effort today. Let's strengthen ${DOMAIN_NAMES[recommended]} next.`;
    reason = `${DOMAIN_NAMES[recommended]} activity performance is at ${score}%, which can benefit from practice.`;
  }

  const nextDifficulty: Difficulty = score >= 80 ? 'challenging' : score >= 65 ? 'medium' : 'easy';

  return { nextDomain: recommended, nextDifficulty, insight, reason };
}

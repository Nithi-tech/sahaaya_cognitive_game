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

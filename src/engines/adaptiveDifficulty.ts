import type { Difficulty, CognitiveDomain, AdaptiveRecommendation } from '../types';

export interface DomainScores {
  memory: number;
  attention: number;
  recognition: number;
  pattern: number;
  routine: number;
}

export interface SessionInput {
  accuracy: number;
  responseTime: number;
  mistakes: number;
  completionRate: number;
  currentDifficulty: Difficulty;
  domain: CognitiveDomain;
  recentDomains: CognitiveDomain[];
}

// ============================================================
// Adaptive Difficulty Engine
// ============================================================

export function computeNextDifficulty(input: SessionInput): Difficulty {
  const { accuracy, responseTime, mistakes, currentDifficulty } = input;

  // Good performance → increase difficulty
  if (accuracy >= 80 && responseTime <= 5 && mistakes <= 1) {
    if (currentDifficulty === 'easy') return 'medium';
    if (currentDifficulty === 'medium') return 'challenging';
    return 'challenging';
  }

  // Moderate performance → maintain
  if (accuracy >= 50 && accuracy < 80) {
    return currentDifficulty;
  }

  // Poor performance → decrease
  if (accuracy < 50 || mistakes >= 4) {
    if (currentDifficulty === 'challenging') return 'medium';
    if (currentDifficulty === 'medium') return 'easy';
    return 'easy';
  }

  return currentDifficulty;
}

export function getDifficultyReason(
  input: SessionInput,
  newDifficulty: Difficulty
): string {
  const { accuracy, mistakes, currentDifficulty } = input;

  if (newDifficulty === currentDifficulty) {
    return `Accuracy was ${accuracy}%. Maintaining current difficulty level.`;
  }

  if (newDifficulty === 'easy' && currentDifficulty !== 'easy') {
    return `Accuracy was ${accuracy}% with ${mistakes} mistake${mistakes !== 1 ? 's' : ''}. Reducing difficulty to keep activities enjoyable.`;
  }

  if (newDifficulty === 'challenging' || (newDifficulty === 'medium' && currentDifficulty === 'easy')) {
    return `Excellent accuracy of ${accuracy}%! Increasing difficulty to keep activities engaging.`;
  }

  return `Adjusting difficulty based on recent performance.`;
}

// ============================================================
// Domain Score Update
// ============================================================

export function updateDomainScore(
  currentScore: number,
  sessionAccuracy: number,
  weight: number = 0.3
): number {
  // Exponential moving average
  const updated = Math.round(currentScore * (1 - weight) + sessionAccuracy * weight);
  return Math.max(0, Math.min(100, updated));
}

// ============================================================
// AI Recommendation Engine
// ============================================================

const DOMAIN_NAMES: Record<CognitiveDomain, string> = {
  memory: 'Memory Match',
  attention: 'Attention',
  recognition: 'Object Recognition',
  pattern: 'Pattern Recognition',
  routine: 'Daily Routine Recall',
};

export function generateRecommendation(
  domainScores: DomainScores,
  recentDomains: CognitiveDomain[],
  sessionAccuracy: number,
): AdaptiveRecommendation {
  const scores = Object.entries(domainScores) as [CognitiveDomain, number][];

  // Find weakest domain (excluding recently played ones if possible)
  const sortedByScore = scores.sort(([, a], [, b]) => a - b);
  let recommended: CognitiveDomain = sortedByScore[0][0];

  // Avoid the same game twice in a row
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

  const nextDifficulty =
    score >= 80 ? 'challenging' : score >= 65 ? 'medium' : 'easy';

  return {
    nextDomain: recommended,
    nextDifficulty,
    insight,
    reason,
  };
}

export function getGameName(domain: CognitiveDomain): string {
  return DOMAIN_NAMES[domain];
}

export function getDomainFromGame(gameType: string): CognitiveDomain {
  const map: Record<string, CognitiveDomain> = {
    memory_match: 'memory',
    family_faces: 'memory',
    object_recognition: 'recognition',
    attention: 'attention',
    pattern: 'pattern',
    routine_recall: 'routine',
  };
  return map[gameType] ?? 'memory';
}

// ============================================================
// Insight Generation
// ============================================================

export function generateInsights(domainScores: DomainScores, trendData: { memory: number; attention: number }[]): string[] {
  const insights: string[] = [];

  if (domainScores.memory < 70) {
    insights.push('Memory activity performance could benefit from more practice sessions.');
  }
  if (domainScores.attention >= 80) {
    insights.push('Attention activities are being completed consistently with good performance.');
  }
  if (domainScores.pattern < 70) {
    insights.push('Pattern recognition activities show room for improvement.');
  }

  if (trendData.length >= 5) {
    const recent = trendData.slice(-5).map((d) => d.memory);
    const older = trendData.slice(-10, -5).map((d) => d.memory);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg < olderAvg - 3) {
      insights.push('Memory activity performance has decreased over the last 5 sessions.');
    }
  }

  return insights;
}

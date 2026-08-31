import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess } from '../auth.js';
import { callGroq } from '../groqClient.js';
import {
  generateRecommendation, generateInsightItems,
  type DomainScores, type CognitiveDomain, type AdaptiveRecommendation, type InsightItem,
} from '../adaptive.js';

export const aiRouter = Router();
aiRouter.use(requireAuth);

interface ProfileRow {
  patient_id: string;
  memory_score: number;
  attention_score: number;
  recognition_score: number;
  pattern_score: number;
  routine_score: number;
  overall_engagement: number;
}

interface SessionRow {
  game_type: string;
  difficulty: string;
  accuracy: number;
  domain: CognitiveDomain;
  timestamp: string;
}

function getDomainScores(patientId: string): DomainScores {
  const row = db.prepare('SELECT * FROM cognitive_profiles WHERE patient_id = ?').get(patientId) as ProfileRow | undefined;
  return {
    memory: row?.memory_score ?? 50,
    attention: row?.attention_score ?? 50,
    recognition: row?.recognition_score ?? 50,
    pattern: row?.pattern_score ?? 50,
    routine: row?.routine_score ?? 50,
  };
}

function getRecentSessions(patientId: string, limit: number): SessionRow[] {
  return db
    .prepare('SELECT game_type, difficulty, accuracy, domain, timestamp FROM cognitive_sessions WHERE patient_id = ? ORDER BY timestamp DESC LIMIT ?')
    .all(patientId, limit) as SessionRow[];
}

// A day-by-day-ish trend carried forward from raw sessions (oldest -> newest)
// — enough for generateInsightItems' "recent vs. older average" comparison,
// without needing a separate historical-scores table.
function buildSimpleTrend(sessions: SessionRow[]): { memory: number; attention: number }[] {
  const chronological = [...sessions].reverse();
  const last: Record<CognitiveDomain, number> = { memory: 70, attention: 70, recognition: 70, pattern: 70, routine: 70 };
  return chronological.map((s) => {
    last[s.domain] = s.accuracy;
    return { memory: last.memory, attention: last.attention };
  });
}

/**
 * Recommends the next domain/difficulty to play. Tries Groq first (a warm,
 * short sentence for the elder + a more detailed one for the caregiver);
 * on any failure (no key, timeout, bad JSON) falls back to the existing
 * rule-based generateRecommendation — the response shape is identical
 * either way, only `source` differs, so the client never has to branch.
 */
aiRouter.post('/recommend/:patientId', requirePatientAccess, async (req, res) => {
  const patientId = String(req.params.patientId);
  const domainScores = getDomainScores(patientId);
  const recentSessions = getRecentSessions(patientId, 10);
  const recentDomains = recentSessions.slice(0, 3).map((s) => s.domain);
  const lastAccuracy = recentSessions[0]?.accuracy ?? 75;

  const fallback = (): AdaptiveRecommendation & { source: 'rule-based' } => ({
    ...generateRecommendation(domainScores, recentDomains, lastAccuracy),
    source: 'rule-based',
  });

  const aiResult = await callGroq([
    {
      role: 'system',
      content:
        'You are a cognitive-activity coach for an elderly user in a memory-care app. ' +
        'Given their domain scores (0-100) and recent session history, recommend which ' +
        'cognitive domain to focus on next and the appropriate difficulty. ' +
        'Respond with ONLY this JSON shape: ' +
        '{"nextDomain": "memory"|"attention"|"recognition"|"pattern"|"routine", ' +
        '"nextDifficulty": "easy"|"medium"|"challenging", ' +
        '"reason": "<one short warm sentence for the elder, no raw percentages>", ' +
        '"insight": "<one short caregiver-facing sentence, may include numbers>"}',
    },
    { role: 'user', content: JSON.stringify({ domainScores, recentSessions }) },
  ]);

  const validDomains = ['memory', 'attention', 'recognition', 'pattern', 'routine'];
  const validDifficulties = ['easy', 'medium', 'challenging'];
  if (
    aiResult &&
    validDomains.includes(aiResult.nextDomain as string) &&
    validDifficulties.includes(aiResult.nextDifficulty as string) &&
    typeof aiResult.reason === 'string' &&
    typeof aiResult.insight === 'string'
  ) {
    return res.json({
      nextDomain: aiResult.nextDomain,
      nextDifficulty: aiResult.nextDifficulty,
      reason: aiResult.reason,
      insight: aiResult.insight,
      source: 'ai',
    });
  }

  res.json(fallback());
});

/**
 * Narrative capability analysis for the caregiver dashboard — on-demand
 * only (called from a button, never automatically), since it's the more
 * expensive of the two AI calls. Falls back to generateInsightItems, which
 * returns the same InsightItem[] shape Groq is asked to produce.
 */
aiRouter.post('/analyze/:patientId', requirePatientAccess, async (req, res) => {
  const patientId = String(req.params.patientId);
  const domainScores = getDomainScores(patientId);
  const recentSessions = getRecentSessions(patientId, 30);
  const trendData = buildSimpleTrend(recentSessions);

  const fallback = (): { insights: InsightItem[]; source: 'rule-based' } => ({
    insights: generateInsightItems(domainScores, trendData),
    source: 'rule-based',
  });

  const aiResult = await callGroq([
    {
      role: 'system',
      content:
        'You are analysing cognitive-game engagement data for a caregiver dashboard — ' +
        'NOT a medical diagnosis. Given domain scores and a trend summary, produce 2-4 ' +
        'narrative insight items. Respond with ONLY this JSON shape: ' +
        '{"insights": [{"domain": "memory"|"attention"|"recognition"|"pattern"|"routine"|null, ' +
        '"title": "<short label>", "insight": "<1-2 sentence observation>", ' +
        '"reason": "<what data supports this>", "action": "<one suggested next step>", ' +
        '"type": "positive"|"neutral"|"attention"}]}',
    },
    { role: 'user', content: JSON.stringify({ domainScores, trendData }) },
  ]);

  const validTypes = ['positive', 'neutral', 'attention'];
  const items = Array.isArray(aiResult?.insights) ? (aiResult!.insights as Record<string, unknown>[]) : null;
  const valid = items?.every(
    (i) => typeof i.title === 'string' && typeof i.insight === 'string' &&
      typeof i.reason === 'string' && typeof i.action === 'string' && validTypes.includes(i.type as string),
  );

  if (items && items.length > 0 && valid) {
    const insights: InsightItem[] = items.map((i, idx) => ({
      id: `ai-${idx}`,
      domain: (i.domain as CognitiveDomain | undefined) ?? undefined,
      title: i.title as string,
      insight: i.insight as string,
      reason: i.reason as string,
      action: i.action as string,
      type: i.type as InsightItem['type'],
    }));
    return res.json({ insights, source: 'ai' });
  }

  res.json(fallback());
});

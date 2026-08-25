import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess } from '../auth.js';
import { applySession } from '../mutations.js';

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

interface SessionRow {
  id: string;
  patient_id: string;
  game_type: string;
  difficulty: string;
  score: number;
  accuracy: number;
  response_time: number;
  mistakes: number;
  completed: number;
  domain: string;
  timestamp: string;
}

function serializeSession(row: SessionRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    gameType: row.game_type,
    difficulty: row.difficulty,
    score: row.score,
    accuracy: row.accuracy,
    responseTime: row.response_time,
    mistakes: row.mistakes,
    completed: !!row.completed,
    domain: row.domain,
    timestamp: row.timestamp,
  };
}

interface ProfileRow {
  patient_id: string;
  memory_score: number;
  attention_score: number;
  recognition_score: number;
  pattern_score: number;
  routine_score: number;
  overall_engagement: number;
  updated_at: string;
}

function serializeProfile(row: ProfileRow) {
  return {
    patientId: row.patient_id,
    memoryScore: row.memory_score,
    attentionScore: row.attention_score,
    recognitionScore: row.recognition_score,
    patternScore: row.pattern_score,
    routineScore: row.routine_score,
    overallEngagement: row.overall_engagement,
    updatedAt: row.updated_at,
  };
}

sessionsRouter.get('/:patientId', requirePatientAccess, (req, res) => {
  const days = Number(req.query.days ?? 30);
  if (!Number.isFinite(days) || days <= 0) return res.status(400).json({ error: 'days must be a positive number' });
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const rows = db
    .prepare('SELECT * FROM cognitive_sessions WHERE patient_id = ? AND timestamp > ? ORDER BY timestamp DESC')
    .all(req.params.patientId, cutoff) as SessionRow[];
  res.json({ sessions: rows.map(serializeSession) });
});

sessionsRouter.get('/:patientId/profile', requirePatientAccess, (req, res) => {
  const row = db.prepare('SELECT * FROM cognitive_profiles WHERE patient_id = ?').get(req.params.patientId) as
    | ProfileRow
    | undefined;
  if (!row) return res.status(404).json({ error: 'No cognitive profile yet' });
  res.json({ profile: serializeProfile(row) });
});

sessionsRouter.post('/:patientId', requirePatientAccess, (req, res) => {
  try {
    const result = applySession(String(req.params.patientId), req.body ?? {});
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

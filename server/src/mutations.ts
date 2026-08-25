// Core write operations, shared between the direct REST routes and the
// offline-sync replay endpoint so both paths run identical logic.
import { db } from './db.js';
import { newId } from './ids.js';
import { updateDomainScore, generateRecommendation, type CognitiveDomain, type DomainScores } from './adaptive.js';
import { evaluateAlerts } from './alertsEngine.js';

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

const VALID_GAME_TYPES = ['memory_match', 'object_recognition', 'attention', 'pattern', 'routine_recall', 'family_faces'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'challenging'];
const VALID_DOMAINS: CognitiveDomain[] = ['memory', 'attention', 'recognition', 'pattern', 'routine'];

export function applySession(patientId: string, body: Record<string, unknown>) {
  const { gameType, difficulty, score, accuracy, responseTime, mistakes, completed, domain } = body as {
    gameType: string;
    difficulty: string;
    score?: number;
    accuracy: number;
    responseTime?: number;
    mistakes?: number;
    completed?: boolean;
    domain: CognitiveDomain;
  };
  if (!gameType || !difficulty || accuracy === undefined || !domain) {
    throw new Error('gameType, difficulty, accuracy, and domain are required');
  }
  if (!VALID_GAME_TYPES.includes(gameType)) throw new Error(`Invalid gameType: ${gameType}`);
  if (!VALID_DIFFICULTIES.includes(difficulty)) throw new Error(`Invalid difficulty: ${difficulty}`);
  if (!VALID_DOMAINS.includes(domain)) throw new Error(`Invalid domain: ${domain}`);
  if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) throw new Error('accuracy must be a number between 0 and 100');

  const id = newId('session');
  const timestamp = new Date().toISOString();
  db.prepare(
    `INSERT INTO cognitive_sessions
     (id, patient_id, game_type, difficulty, score, accuracy, response_time, mistakes, completed, domain, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, patientId, gameType, difficulty, score ?? accuracy, accuracy, responseTime ?? 0, mistakes ?? 0, completed ? 1 : 0, domain, timestamp);

  let profileRow = db.prepare('SELECT * FROM cognitive_profiles WHERE patient_id = ?').get(patientId) as
    | ProfileRow
    | undefined;
  if (!profileRow) {
    db.prepare(
      `INSERT INTO cognitive_profiles (patient_id, memory_score, attention_score, recognition_score, pattern_score, routine_score, overall_engagement, updated_at)
       VALUES (?, 50, 50, 50, 50, 50, 50, ?)`,
    ).run(patientId, timestamp);
    profileRow = db.prepare('SELECT * FROM cognitive_profiles WHERE patient_id = ?').get(patientId) as ProfileRow;
  }

  const columnByDomain: Record<CognitiveDomain, keyof ProfileRow> = {
    memory: 'memory_score',
    attention: 'attention_score',
    recognition: 'recognition_score',
    pattern: 'pattern_score',
    routine: 'routine_score',
  };
  const col = columnByDomain[domain];
  const updatedScore = updateDomainScore(profileRow[col] as number, accuracy);
  const updated = { ...profileRow, [col]: updatedScore };
  updated.overall_engagement = Math.round(
    (updated.memory_score + updated.attention_score + updated.recognition_score + updated.pattern_score + updated.routine_score) / 5,
  );
  updated.updated_at = timestamp;

  db.prepare(
    `UPDATE cognitive_profiles SET memory_score=?, attention_score=?, recognition_score=?, pattern_score=?, routine_score=?, overall_engagement=?, updated_at=?
     WHERE patient_id=?`,
  ).run(
    updated.memory_score,
    updated.attention_score,
    updated.recognition_score,
    updated.pattern_score,
    updated.routine_score,
    updated.overall_engagement,
    updated.updated_at,
    patientId,
  );

  const recentDomains = (
    db
      .prepare('SELECT domain FROM cognitive_sessions WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 3')
      .all(patientId) as { domain: CognitiveDomain }[]
  ).map((r) => r.domain);

  const domainScores: DomainScores = {
    memory: updated.memory_score,
    attention: updated.attention_score,
    recognition: updated.recognition_score,
    pattern: updated.pattern_score,
    routine: updated.routine_score,
  };
  const recommendation = generateRecommendation(domainScores, recentDomains, accuracy);

  evaluateAlerts(patientId);

  return {
    session: { id, patientId, gameType, difficulty, score: score ?? accuracy, accuracy, responseTime: responseTime ?? 0, mistakes: mistakes ?? 0, completed: !!completed, domain, timestamp },
    profile: {
      patientId: updated.patient_id,
      memoryScore: updated.memory_score,
      attentionScore: updated.attention_score,
      recognitionScore: updated.recognition_score,
      patternScore: updated.pattern_score,
      routineScore: updated.routine_score,
      overallEngagement: updated.overall_engagement,
      updatedAt: updated.updated_at,
    },
    recommendation,
  };
}

export function applyReminderCreate(patientId: string, body: Record<string, unknown>) {
  const { type, title, description, time, date } = body as Record<string, string | undefined>;
  if (!type || !title || !time) throw new Error('type, title, and time are required');
  const id = newId('rem');
  db.prepare(
    'INSERT INTO reminders (id, patient_id, type, title, description, time, status, date, adherence_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, patientId, type, title, description ?? '', time, 'scheduled', date ?? null, null);
  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
}

const VALID_REMINDER_STATUSES = ['scheduled', 'completed', 'skipped', 'delayed'];

export function applyReminderStatus(patientId: string, reminderId: string, status: string) {
  if (!VALID_REMINDER_STATUSES.includes(status)) throw new Error(`Invalid reminder status: ${status}`);
  const row = db.prepare('SELECT * FROM reminders WHERE id = ? AND patient_id = ?').get(reminderId, patientId) as
    | { type: string; title: string }
    | undefined;
  if (!row) throw new Error('Reminder not found');

  db.prepare('UPDATE reminders SET status = ? WHERE id = ?').run(status, reminderId);

  const siblings = db
    .prepare('SELECT status FROM reminders WHERE patient_id = ? AND type = ? AND title = ?')
    .all(patientId, row.type, row.title) as { status: string }[];
  const completedCount = siblings.filter((r) => r.status === 'completed').length;
  const decidedCount = siblings.filter((r) => ['completed', 'skipped'].includes(r.status)).length;
  const adherence = decidedCount > 0 ? Math.round((completedCount / decidedCount) * 100) : null;
  db.prepare('UPDATE reminders SET adherence_rate = ? WHERE patient_id = ? AND type = ? AND title = ?').run(
    adherence,
    patientId,
    row.type,
    row.title,
  );

  evaluateAlerts(patientId);
  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(reminderId);
}

export function applyMemoryCreate(patientId: string, body: Record<string, unknown>) {
  const { category, title, description, imageUrl, audioUrl, voiceText, relationship, notes } = body as Record<string, string | undefined>;
  if (!category || !title) throw new Error('category and title are required');
  const id = newId('mem');
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO memories (id, patient_id, category, title, description, image_url, audio_url, voice_text, relationship, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, patientId, category, title, description ?? '', imageUrl ?? null, audioUrl ?? null, voiceText ?? null, relationship ?? null, notes ?? null, createdAt);
  return db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
}

export function applyDailyActivityStatus(patientId: string, activityId: string, status: string) {
  if (!['pending', 'completed', 'skipped'].includes(status)) throw new Error(`Invalid activity status: ${status}`);
  db.prepare('UPDATE daily_activities SET status = ? WHERE id = ? AND patient_id = ?').run(status, activityId, patientId);
  // Re-scoped by patient_id — without it, a caller passing an activityId that
  // belongs to a DIFFERENT patient gets a no-op UPDATE but this SELECT would
  // still happily return (and leak) that other patient's row.
  return db.prepare('SELECT * FROM daily_activities WHERE id = ? AND patient_id = ?').get(activityId, patientId);
}

export function applyAlertResolve(patientId: string, alertId: string) {
  db.prepare('UPDATE alerts SET resolved = 1 WHERE id = ? AND patient_id = ?').run(alertId, patientId);
  // Re-scoped by patient_id — see applyDailyActivityStatus above for why.
  return db.prepare('SELECT * FROM alerts WHERE id = ? AND patient_id = ?').get(alertId, patientId);
}

export function applyPatientPreferencesUpdate(patientId: string, preferences: Record<string, unknown>) {
  if (!preferences || typeof preferences !== 'object') throw new Error('preferences is required');
  db.prepare('UPDATE patients SET preferences_json = ? WHERE id = ?').run(JSON.stringify(preferences), patientId);
  return db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
}

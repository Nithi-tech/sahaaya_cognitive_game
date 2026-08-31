import { db } from './db.js';
import { newId } from './ids.js';

interface SessionRow {
  accuracy: number;
  domain: string;
  timestamp: string;
}
interface ReminderRow {
  status: string;
  type: string;
}

function hasRecentAlert(patientId: string, type: string, sinceHours = 20): boolean {
  const cutoff = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();
  const row = db
    .prepare('SELECT id FROM alerts WHERE patient_id = ? AND type = ? AND resolved = 0 AND created_at > ?')
    .get(patientId, type, cutoff);
  return !!row;
}

function insertAlert(
  patientId: string,
  type: string,
  severity: 'low' | 'medium' | 'high',
  message: string,
  detail: string,
  action: string,
) {
  db.prepare(
    'INSERT INTO alerts (id, patient_id, type, severity, message, detail, action, created_at, resolved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
  ).run(newId('alert'), patientId, type, severity, message, detail, action, new Date().toISOString());
}

/**
 * Real, non-clinical caregiver alerts computed from actual stored activity —
 * not a static list. Runs after any session/reminder write so the caregiver
 * dashboard reflects what actually happened.
 */
export function evaluateAlerts(patientId: string) {
  const sessions = db
    .prepare('SELECT accuracy, domain, timestamp FROM cognitive_sessions WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 10')
    .all(patientId) as SessionRow[];

  const todayStr = new Date().toISOString().split('T')[0];
  const sessionsToday = sessions.filter((s) => s.timestamp.startsWith(todayStr));
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const sessionsYesterday = sessions.filter((s) => s.timestamp.startsWith(yesterday));

  if (sessionsYesterday.length === 0 && !hasRecentAlert(patientId, 'activity')) {
    insertAlert(
      patientId,
      'activity',
      'low',
      'No cognitive activity completed yesterday.',
      `The patient did not complete any scheduled cognitive activities on ${yesterday}.`,
      'Check in with the patient to understand if they were feeling unwell.',
    );
  }

  if (sessions.length >= 5) {
    const recent5 = sessions.slice(0, 5).map((s) => s.accuracy);
    const older5 = sessions.slice(5, 10).map((s) => s.accuracy);
    if (older5.length >= 3) {
      const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;
      const olderAvg = older5.reduce((a, b) => a + b, 0) / older5.length;
      if (recentAvg < olderAvg - 8 && !hasRecentAlert(patientId, 'activity')) {
        insertAlert(
          patientId,
          'activity',
          'medium',
          'Activity performance has changed over the last 5 sessions.',
          `Average accuracy decreased from ${Math.round(olderAvg)}% to ${Math.round(recentAvg)}% over the last 5 sessions.`,
          'Consider scheduling a favorite activity today and check in with the patient.',
        );
      }
    }
  }

  const reminders = db.prepare('SELECT status, type FROM reminders WHERE patient_id = ?').all(patientId) as ReminderRow[];
  const hydration = reminders.filter((r) => r.type === 'hydration');
  // 'missed' is not a real reminder status (VALID_REMINDER_STATUSES in
  // mutations.ts is scheduled/completed/skipped/delayed) — only 'skipped'
  // can ever appear here.
  const hydrationMissed = hydration.filter((r) => r.status === 'skipped').length;
  if (hydration.length > 0 && hydrationMissed >= 3 && !hasRecentAlert(patientId, 'hydration')) {
    insertAlert(
      patientId,
      'hydration',
      'medium',
      `Hydration reminders missed ${hydrationMissed} times.`,
      'Several hydration reminders were skipped or missed.',
      'Encourage the patient to keep a water bottle nearby. Consider adjusting reminder times.',
    );
  }

  if (sessionsToday.length > 0) {
    const avgToday = sessionsToday.reduce((a, b) => a + b.accuracy, 0) / sessionsToday.length;
    if (avgToday >= 85 && !hasRecentAlert(patientId, 'engagement')) {
      insertAlert(
        patientId,
        'engagement',
        'low',
        'Great engagement today!',
        `Today's activities averaged ${Math.round(avgToday)}% accuracy.`,
        'Maintain the current activity schedule.',
      );
    }
  }
}

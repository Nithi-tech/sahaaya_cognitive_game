import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { newId } from '../ids.js';
import { applySession, applyReminderStatus, applyReminderCreate, applyMemoryCreate, applyDailyActivityStatus, applyAlertResolve, applyPatientPreferencesUpdate } from '../mutations.js';

export const syncRouter = Router();
syncRouter.use(requireAuth);

interface SyncItem {
  id: string;
  patientId: string;
  actionType:
    | 'addSession'
    | 'addReminder'
    | 'setReminderStatus'
    | 'addMemory'
    | 'setDailyActivityStatus'
    | 'resolveAlert'
    | 'updatePatientPreferences'
    | 'addActivityNotification';
  payload: Record<string, unknown>;
}

interface PatientAccessRow {
  user_id: string;
  caregiver_id: string;
  healthcare_worker_id: string | null;
}

function canAccessPatient(patientId: string, user: { id: string; role: string }): boolean {
  const patient = db
    .prepare('SELECT user_id, caregiver_id, healthcare_worker_id FROM patients WHERE id = ?')
    .get(patientId) as PatientAccessRow | undefined;
  if (!patient) return false;
  return (
    (user.role === 'elderly' && patient.user_id === user.id) ||
    (user.role === 'caregiver' && patient.caregiver_id === user.id) ||
    (user.role === 'healthcare' && patient.healthcare_worker_id === user.id)
  );
}

interface SyncLogRow {
  status: 'synced' | 'failed';
  result_json: string | null;
}

// Replays a batch of offline-queued mutations, in order, against the same
// logic the direct REST endpoints use. Returns a per-item result so the
// client's sync queue can mark each entry SYNCED or FAILED individually.
//
// Idempotent by item.id (the client-generated queue-item id, stable across
// retries of the same offline action): if this exact item was already
// applied successfully in a previous batch — e.g. the client resent it
// because a reconnect happened right as the first response was in flight —
// we return the cached result instead of re-running the mutation and
// creating a second record.
syncRouter.post('/', (req, res) => {
  const items = (req.body?.items ?? []) as SyncItem[];
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
  const user = req.authUser!;
  const results: { id: string; status: 'synced' | 'failed'; error?: string; data?: unknown }[] = [];

  for (const item of items) {
    const previous = db.prepare('SELECT status, result_json FROM sync_log WHERE client_id = ?').get(item.id) as
      | SyncLogRow
      | undefined;
    if (previous?.status === 'synced') {
      results.push({ id: item.id, status: 'synced', data: previous.result_json ? JSON.parse(previous.result_json) : undefined });
      continue;
    }

    try {
      if (!canAccessPatient(item.patientId, user)) throw new Error('Forbidden: not assigned to this patient');

      let data: unknown;
      switch (item.actionType) {
        case 'addSession':
          data = applySession(item.patientId, item.payload);
          break;
        case 'addReminder':
          data = applyReminderCreate(item.patientId, item.payload);
          break;
        case 'setReminderStatus':
          data = applyReminderStatus(item.patientId, item.payload.reminderId as string, item.payload.status as string);
          break;
        case 'addMemory':
          data = applyMemoryCreate(item.patientId, item.payload);
          break;
        case 'setDailyActivityStatus':
          data = applyDailyActivityStatus(item.patientId, item.payload.activityId as string, item.payload.status as string);
          break;
        case 'resolveAlert':
          data = applyAlertResolve(item.patientId, item.payload.alertId as string);
          break;
        case 'updatePatientPreferences':
          data = applyPatientPreferencesUpdate(item.patientId, item.payload);
          break;
        case 'addActivityNotification':
          data = { received: true, id: item.id, ...item.payload };
          break;
        default:
          throw new Error(`Unknown actionType: ${item.actionType}`);
      }

      db.prepare(
        'INSERT OR REPLACE INTO sync_log (id, client_id, patient_id, action_type, payload_json, result_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(newId('sync'), item.id, item.patientId, item.actionType, JSON.stringify(item.payload), JSON.stringify(data ?? null), 'synced', new Date().toISOString());

      results.push({ id: item.id, status: 'synced', data });
    } catch (err) {
      db.prepare(
        'INSERT OR REPLACE INTO sync_log (id, client_id, patient_id, action_type, payload_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(newId('sync'), item.id, item.patientId, item.actionType, JSON.stringify(item.payload), 'failed', new Date().toISOString());
      results.push({ id: item.id, status: 'failed', error: (err as Error).message });
    }
  }

  res.json({ results });
});

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
    | 'updatePatientPreferences';
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

// Replays a batch of offline-queued mutations, in order, against the same
// logic the direct REST endpoints use. Returns a per-item result so the
// client's sync queue can mark each entry SYNCED or FAILED individually.
syncRouter.post('/', (req, res) => {
  const items = (req.body?.items ?? []) as SyncItem[];
  const user = req.authUser!;
  const results: { id: string; status: 'synced' | 'failed'; error?: string }[] = [];

  for (const item of items) {
    try {
      if (!canAccessPatient(item.patientId, user)) throw new Error('Forbidden: not assigned to this patient');

      switch (item.actionType) {
        case 'addSession':
          applySession(item.patientId, item.payload);
          break;
        case 'addReminder':
          applyReminderCreate(item.patientId, item.payload);
          break;
        case 'setReminderStatus':
          applyReminderStatus(item.patientId, item.payload.reminderId as string, item.payload.status as string);
          break;
        case 'addMemory':
          applyMemoryCreate(item.patientId, item.payload);
          break;
        case 'setDailyActivityStatus':
          applyDailyActivityStatus(item.patientId, item.payload.activityId as string, item.payload.status as string);
          break;
        case 'resolveAlert':
          applyAlertResolve(item.patientId, item.payload.alertId as string);
          break;
        case 'updatePatientPreferences':
          applyPatientPreferencesUpdate(item.patientId, item.payload);
          break;
        default:
          throw new Error(`Unknown actionType: ${item.actionType}`);
      }

      db.prepare(
        'INSERT INTO sync_log (id, patient_id, action_type, payload_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(newId('sync'), item.patientId, item.actionType, JSON.stringify(item.payload), 'synced', new Date().toISOString());

      results.push({ id: item.id, status: 'synced' });
    } catch (err) {
      db.prepare(
        'INSERT INTO sync_log (id, patient_id, action_type, payload_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(newId('sync'), item.patientId, item.actionType, JSON.stringify(item.payload), 'failed', new Date().toISOString());
      results.push({ id: item.id, status: 'failed', error: (err as Error).message });
    }
  }

  res.json({ results });
});

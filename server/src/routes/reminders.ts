import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess } from '../auth.js';
import { applyReminderStatus, applyReminderCreate } from '../mutations.js';

export const remindersRouter = Router();
remindersRouter.use(requireAuth);

interface ReminderRow {
  id: string;
  patient_id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  status: string;
  date: string | null;
  adherence_rate: number | null;
}

function serialize(row: ReminderRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    type: row.type,
    title: row.title,
    description: row.description,
    time: row.time,
    status: row.status,
    date: row.date ?? undefined,
    adherenceRate: row.adherence_rate ?? undefined,
  };
}

remindersRouter.get('/:patientId', requirePatientAccess, (req, res) => {
  const rows = db.prepare('SELECT * FROM reminders WHERE patient_id = ?').all(req.params.patientId) as ReminderRow[];
  res.json({ reminders: rows.map(serialize) });
});

remindersRouter.post('/:patientId', requirePatientAccess, (req, res) => {
  try {
    const row = applyReminderCreate(String(req.params.patientId), req.body ?? {}) as ReminderRow;
    res.status(201).json({ reminder: serialize(row) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Status transition endpoint — enforces the real reminder lifecycle
// (scheduled → completed / skipped / delayed) rather than letting the client
// set arbitrary fields.
remindersRouter.patch('/:patientId/:reminderId/status', requirePatientAccess, (req, res) => {
  const { status } = req.body ?? {};
  try {
    const updated = applyReminderStatus(String(req.params.patientId), String(req.params.reminderId), status) as ReminderRow | undefined;
    if (!updated) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ reminder: serialize(updated) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

remindersRouter.delete('/:patientId/:reminderId', requirePatientAccess, (req, res) => {
  db.prepare('DELETE FROM reminders WHERE id = ? AND patient_id = ?').run(req.params.reminderId, req.params.patientId);
  res.status(204).send();
});

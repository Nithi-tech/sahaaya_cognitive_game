import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess } from '../auth.js';
import { applyDailyActivityStatus } from '../mutations.js';

export const dailyActivitiesRouter = Router();
dailyActivitiesRouter.use(requireAuth);

interface ActivityRow {
  id: string;
  patient_id: string;
  activity: string;
  emoji: string;
  scheduled_time: string;
  status: string;
  date: string;
}

function serialize(row: ActivityRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    activity: row.activity,
    emoji: row.emoji,
    scheduledTime: row.scheduled_time,
    status: row.status,
    date: row.date,
  };
}

dailyActivitiesRouter.get('/:patientId', requirePatientAccess, (req, res) => {
  const date = (req.query.date as string) ?? new Date().toISOString().split('T')[0];
  const rows = db
    .prepare('SELECT * FROM daily_activities WHERE patient_id = ? AND date = ? ORDER BY scheduled_time')
    .all(req.params.patientId, date) as ActivityRow[];
  res.json({ activities: rows.map(serialize) });
});

dailyActivitiesRouter.patch('/:patientId/:activityId', requirePatientAccess, (req, res) => {
  try {
    const row = applyDailyActivityStatus(String(req.params.patientId), String(req.params.activityId), req.body?.status) as ActivityRow;
    res.json({ activity: serialize(row) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

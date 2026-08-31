import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess, requireRole } from '../auth.js';
import { applyAlertResolve } from '../mutations.js';
import { applyIdleAlert } from '../alertsEngine.js';

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

interface AlertRow {
  id: string;
  patient_id: string;
  type: string;
  severity: string;
  message: string;
  detail: string | null;
  action: string | null;
  created_at: string;
  resolved: number;
}

function serialize(row: AlertRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    detail: row.detail ?? undefined,
    action: row.action ?? undefined,
    createdAt: row.created_at,
    resolved: !!row.resolved,
  };
}

alertsRouter.get('/:patientId', requirePatientAccess, (req, res) => {
  const rows = db.prepare('SELECT * FROM alerts WHERE patient_id = ? ORDER BY created_at DESC').all(
    req.params.patientId,
  ) as AlertRow[];
  res.json({ alerts: rows.map(serialize) });
});

alertsRouter.patch('/:patientId/:alertId/resolve', requirePatientAccess, (req, res) => {
  const row = applyAlertResolve(String(req.params.patientId), String(req.params.alertId)) as AlertRow | undefined;
  if (!row) return res.status(404).json({ error: 'Alert not found' });
  res.json({ alert: serialize(row) });
});

// Only the elder's own logged-in session can report its own idleness —
// a caregiver/HCW account has no business claiming a patient went idle.
alertsRouter.post('/:patientId/idle', requirePatientAccess, requireRole('elderly'), (req, res) => {
  const patientId = String(req.params.patientId);
  const patient = db.prepare('SELECT name FROM patients WHERE id = ?').get(patientId) as { name: string } | undefined;
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const created = applyIdleAlert(patientId, patient.name);
  res.status(created ? 201 : 200).json({ created: !!created });
});

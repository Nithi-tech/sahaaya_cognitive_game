import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess } from '../auth.js';
import { applyAlertResolve } from '../mutations.js';

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
  const row = applyAlertResolve(String(req.params.patientId), String(req.params.alertId)) as AlertRow;
  res.json({ alert: serialize(row) });
});

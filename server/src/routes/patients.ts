import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess } from '../auth.js';
import { applyPatientPreferencesUpdate } from '../mutations.js';

export const patientsRouter = Router();
patientsRouter.use(requireAuth);

interface PatientRow {
  id: string;
  user_id: string;
  name: string;
  age: number;
  language: string;
  region: string;
  caregiver_id: string;
  healthcare_worker_id: string | null;
  preferences_json: string;
  created_at: string;
}

function serialize(row: PatientRow) {
  const caregiver = db.prepare('SELECT name FROM users WHERE id = ?').get(row.caregiver_id) as
    | { name: string }
    | undefined;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    age: row.age,
    language: row.language,
    region: row.region,
    caregiverId: row.caregiver_id,
    healthcareWorkerId: row.healthcare_worker_id ?? undefined,
    caregiverName: caregiver?.name ?? '',
    preferences: JSON.parse(row.preferences_json),
    createdAt: row.created_at,
  };
}

// List patients the current user is allowed to see.
patientsRouter.get('/', (req, res) => {
  const user = req.authUser!;
  let rows: PatientRow[];
  if (user.role === 'elderly') {
    rows = db.prepare('SELECT * FROM patients WHERE user_id = ?').all(user.id) as PatientRow[];
  } else if (user.role === 'caregiver') {
    rows = db.prepare('SELECT * FROM patients WHERE caregiver_id = ?').all(user.id) as PatientRow[];
  } else {
    rows = db.prepare('SELECT * FROM patients WHERE healthcare_worker_id = ?').all(user.id) as PatientRow[];
  }
  res.json({ patients: rows.map(serialize) });
});

patientsRouter.get('/:patientId', requirePatientAccess, (req, res) => {
  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.patientId) as PatientRow;
  res.json({ patient: serialize(row) });
});

patientsRouter.patch('/:patientId', requirePatientAccess, (req, res) => {
  try {
    const row = applyPatientPreferencesUpdate(String(req.params.patientId), req.body?.preferences) as PatientRow;
    res.json({ patient: serialize(row) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

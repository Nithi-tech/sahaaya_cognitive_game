import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess, requireRole } from '../auth.js';
import { applyPatientPreferencesUpdate, applyPatientProfileUpdate } from '../mutations.js';
import { newId } from '../ids.js';

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
  onboarding_complete: number;
  created_at: string;
}

function serialize(row: PatientRow, viewerRole?: string) {
  const caregiver = db.prepare('SELECT name FROM users WHERE id = ?').get(row.caregiver_id) as
    | { name: string }
    | undefined;
  const elderUser = db.prepare('SELECT elder_access_id FROM users WHERE id = ?').get(row.user_id) as
    | { elder_access_id: string | null }
    | undefined;

  let elderAccessId = elderUser?.elder_access_id ?? undefined;
  if (!elderAccessId) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = `SAH-${Math.floor(1000 + Math.random() * 9000)}`;
      const exists = db.prepare('SELECT id FROM users WHERE elder_access_id = ?').get(candidate);
      if (!exists) {
        elderAccessId = candidate;
        db.prepare('UPDATE users SET elder_access_id = ? WHERE id = ?').run(candidate, row.user_id);
        break;
      }
    }
  }

  const preferences = JSON.parse(row.preferences_json);
  // The Health & Safety onboarding section is explicitly caregiver-only —
  // the elder's own login must never see it, matching the banner shown on
  // Step5_Health.tsx during onboarding.
  if (viewerRole === 'elderly' && preferences.onboarding) {
    delete preferences.onboarding.health;
  }
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
    preferences,
    onboardingComplete: row.onboarding_complete === 1,
    elderAccessId,
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
  res.json({ patients: rows.map((r) => serialize(r, user.role)) });
});

patientsRouter.get('/:patientId', requirePatientAccess, (req, res) => {
  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.patientId) as PatientRow;
  res.json({ patient: serialize(row, req.authUser!.role) });
});

// Create a new patient and an associated system elder account.
// Only caregivers can do this — they are responsible for setting up the
// elder's profile before the elder ever touches the app.
patientsRouter.post('/', requireRole('caregiver'), async (req, res) => {
  const { name, age, region, language, pin, accessId, uniqueId } = req.body ?? {};
  if (!name || !age || !region) {
    return res.status(400).json({ error: 'name, age, and region are required' });
  }

  // If a legacy pin was provided and is malformed, reject it
  if (pin !== undefined && (typeof pin !== 'string' || (!/^\d{4}$/.test(pin) && !/^SAH-\d{4}$/i.test(pin)))) {
    return res.status(400).json({ error: 'pin must be a 4-digit number string' });
  }

  // Format or generate Unique Elder Access ID (e.g. SAH-4821)
  let elderAccessId = String(accessId || uniqueId || '').trim().toUpperCase();
  if (!elderAccessId) {
    if (pin && /^\d{4}$/.test(pin)) {
      elderAccessId = `SAH-${pin}`;
    } else {
      // Generate a unique 4-digit suffix
      let candidate = '';
      for (let attempt = 0; attempt < 10; attempt++) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        candidate = `SAH-${rand}`;
        const exists = db.prepare('SELECT id FROM users WHERE elder_access_id = ?').get(candidate);
        if (!exists) break;
      }
      elderAccessId = candidate;
    }
  }

  const rawSecret = pin || elderAccessId.replace('SAH-', '') || '0000';
  const caregiverId = req.authUser!.id;
  const patientId = newId('patient');
  const elderUserId = newId('user');
  const syntheticEmail = `elder_${patientId}@sahaaya.internal`;
  const pinHash = await bcrypt.hash(rawSecret, 10);

  const defaultPreferences = {
    preferredLanguage: language ?? 'en',
    preferredActivityTime: '10:00',
    favoriteCategory: 'family',
    favoriteContent: '',
    difficulty: 'adaptive',
    voiceEnabled: true,
  };

  const insertUser = db.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, language, pin_hash, elder_access_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertPatient = db.prepare(
    'INSERT INTO patients (id, user_id, name, age, language, region, caregiver_id, healthcare_worker_id, preferences_json, onboarding_complete) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  insertUser.run(elderUserId, syntheticEmail, pinHash, name, 'elderly', language ?? 'en', pinHash, elderAccessId);
  insertPatient.run(
    patientId, elderUserId, name, Number(age), language ?? 'en',
    region, caregiverId, null, JSON.stringify(defaultPreferences), 0
  );

  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId) as PatientRow;
  res.status(201).json({
    patient: serialize(row, req.authUser!.role),
    elderEmail: syntheticEmail,
    elderAccessId,
    uniqueId: elderAccessId,
    pinHint: pin || elderAccessId,
  });
});

patientsRouter.patch('/:patientId', requirePatientAccess, (req, res) => {
  try {
    const { preferences, name, age, region, language } = req.body ?? {};
    let row: PatientRow;
    if (name !== undefined || age !== undefined || region !== undefined || language !== undefined) {
      if (req.authUser!.role !== 'caregiver') {
        return res.status(403).json({ error: 'Forbidden: only the caregiver can edit these details' });
      }
      row = applyPatientProfileUpdate(String(req.params.patientId), { name, age, region, language }) as PatientRow;
    } else {
      row = applyPatientPreferencesUpdate(String(req.params.patientId), preferences) as PatientRow;
    }
    res.json({ patient: serialize(row, req.authUser!.role) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Mark onboarding complete for a patient.
patientsRouter.patch('/:patientId/onboarding-complete', requirePatientAccess, requireRole('caregiver'), (req, res) => {
  db.prepare('UPDATE patients SET onboarding_complete = 1 WHERE id = ?').run(req.params.patientId);
  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.patientId) as PatientRow;
  res.json({ patient: serialize(row, req.authUser!.role) });
});

// Delete a patient and their entire history (caregiver-only).
patientsRouter.delete('/:patientId', requirePatientAccess, requireRole('caregiver'), (req, res) => {
  const patientId = String(req.params.patientId);
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId) as PatientRow | undefined;
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Ensure this caregiver owns this patient
  if (patient.caregiver_id !== req.authUser!.id) {
    return res.status(403).json({ error: 'Forbidden: you can only delete your own patients' });
  }

  const deleteTransaction = db.transaction(() => {
    db.prepare('DELETE FROM cognitive_profiles WHERE patient_id = ?').run(patientId);
    db.prepare('DELETE FROM cognitive_sessions WHERE patient_id = ?').run(patientId);
    db.prepare('DELETE FROM reminders WHERE patient_id = ?').run(patientId);
    db.prepare('DELETE FROM memories WHERE patient_id = ?').run(patientId);
    db.prepare('DELETE FROM daily_activities WHERE patient_id = ?').run(patientId);
    db.prepare('DELETE FROM alerts WHERE patient_id = ?').run(patientId);
    db.prepare('DELETE FROM patients WHERE id = ?').run(patientId);
    // Delete the elder user account associated with this patient
    if (patient.user_id) {
      db.prepare('DELETE FROM users WHERE id = ?').run(patient.user_id);
    }
  });

  deleteTransaction();
  res.json({ ok: true, deletedPatientId: patientId });
});


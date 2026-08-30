import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth, type Role } from '../auth.js';
import { newId } from '../ids.js';

export const authRouter = Router();

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: Role;
  language: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

authRouter.post('/register', async (req, res) => {
  const { password, name, role, language } = req.body ?? {};
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : req.body?.email;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'email, password, name, and role are required' });
  }
  if (!['elderly', 'caregiver', 'healthcare'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const id = newId('user');
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, role, language) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, email, passwordHash, name, role, language ?? 'en');
  } catch (err) {
    // Two concurrent registrations for the same email can both pass the SELECT
    // check above before either INSERTs — the UNIQUE constraint is the real
    // guarantee; translate its violation into the same clean 409 rather than
    // letting it fall through to a raw 500.
    if ((err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw err;
  }

  const user = { id, email, name, role: role as Role, language: language ?? 'en' };
  res.status(201).json({ token: signToken(user), user });
});

authRouter.post('/login', async (req, res) => {
  const { password } = req.body ?? {};
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : req.body?.email;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!row) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const user = { id: row.id, email: row.email, name: row.name, role: row.role, language: row.language };
  res.json({ token: signToken(user), user });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.authUser });
});

// Elder Access ID login — the elder only enters their unique ID (e.g. SAH-4821).
// No need to select a patient, know an email, or enter a separate password.
authRouter.post('/elder-login', async (req, res) => {
  const rawInput = req.body?.accessId || req.body?.uniqueId || req.body?.id;
  if (!rawInput) {
    return res.status(400).json({ error: 'Please enter your Elder Access ID' });
  }

  const cleaned = String(rawInput).trim().toUpperCase();
  const altCleaned = cleaned.startsWith('SAH-') ? cleaned.replace('SAH-', '') : `SAH-${cleaned}`;

  const row = db.prepare(`
    SELECT id, email, name, role, language 
    FROM users 
    WHERE (UPPER(elder_access_id) = ? OR UPPER(elder_access_id) = ?) 
      AND role = 'elderly'
  `).get(cleaned, altCleaned) as UserRow | undefined;

  if (!row) {
    return res.status(401).json({ error: 'Invalid Elder Access ID. Please check your ID and try again.' });
  }

  const user = { id: row.id, email: row.email, name: row.name, role: row.role, language: row.language };
  return res.json({ token: signToken(user), user });
});

// PIN / Unique ID login route supporting both direct accessId and legacy { patientId, pin }
authRouter.post('/pin-login', async (req, res) => {
  const rawInput = req.body?.accessId || req.body?.uniqueId || (!req.body?.patientId ? req.body?.pin : undefined);
  if (rawInput) {
    const cleaned = String(rawInput).trim().toUpperCase();
    const altCleaned = cleaned.startsWith('SAH-') ? cleaned.replace('SAH-', '') : `SAH-${cleaned}`;

    const row = db.prepare(`
      SELECT id, email, name, role, language 
      FROM users 
      WHERE (UPPER(elder_access_id) = ? OR UPPER(elder_access_id) = ?) 
        AND role = 'elderly'
    `).get(cleaned, altCleaned) as UserRow | undefined;

    if (!row) {
      return res.status(401).json({ error: 'Invalid Elder Access ID. Please check your ID and try again.' });
    }

    const user = { id: row.id, email: row.email, name: row.name, role: row.role, language: row.language };
    return res.json({ token: signToken(user), user });
  }

  const { patientId, pin } = req.body ?? {};
  if (!patientId || !pin) {
    return res.status(400).json({ error: 'patientId and pin are required' });
  }

  // Find the patient row to get its linked elder user_id.
  const patient = db.prepare('SELECT user_id FROM patients WHERE id = ?').get(patientId) as
    | { user_id: string }
    | undefined;
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Fetch the elder user
  const row = db
    .prepare('SELECT id, email, name, role, language, pin_hash FROM users WHERE id = ?')
    .get(patient.user_id) as (UserRow & { pin_hash: string | null }) | undefined;

  if (!row || !row.pin_hash) {
    return res.status(401).json({ error: 'PIN login is not enabled for this account' });
  }
  if (row.role !== 'elderly') {
    return res.status(403).json({ error: 'PIN login is only available for elder accounts' });
  }

  const valid = await bcrypt.compare(String(pin), row.pin_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect PIN' });

  const user = { id: row.id, email: row.email, name: row.name, role: row.role, language: row.language };
  res.json({ token: signToken(user), user });
});


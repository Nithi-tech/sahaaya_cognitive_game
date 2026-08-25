import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

export const JWT_SECRET = process.env.SAHAAYA_JWT_SECRET ?? 'sahaaya-dev-secret-change-in-production';

export type Role = 'elderly' | 'caregiver' | 'healthcare';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  language: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = db.prepare('SELECT id, email, name, role, language FROM users WHERE id = ?').get(payload.sub) as
      | AuthUser
      | undefined;
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.authUser = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

interface PatientRow {
  id: string;
  user_id: string;
  caregiver_id: string;
  healthcare_worker_id: string | null;
}

/** Enforces that the authenticated user is actually allowed to touch this patient's data. */
export function requirePatientAccess(req: Request, res: Response, next: NextFunction) {
  const patientId = req.params.patientId ?? req.body?.patientId;
  if (!patientId) return res.status(400).json({ error: 'patientId is required' });

  const patient = db.prepare('SELECT id, user_id, caregiver_id, healthcare_worker_id FROM patients WHERE id = ?').get(
    patientId,
  ) as PatientRow | undefined;
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const user = req.authUser!;
  const allowed =
    (user.role === 'elderly' && patient.user_id === user.id) ||
    (user.role === 'caregiver' && patient.caregiver_id === user.id) ||
    (user.role === 'healthcare' && patient.healthcare_worker_id === user.id);

  if (!allowed) return res.status(403).json({ error: 'Forbidden: not assigned to this patient' });
  next();
}

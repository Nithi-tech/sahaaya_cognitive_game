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

authRouter.post('/register', async (req, res) => {
  const { email, password, name, role, language } = req.body ?? {};
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
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, language) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, email, passwordHash, name, role, language ?? 'en');

  const user = { id, email, name, role: role as Role, language: language ?? 'en' };
  res.status(201).json({ token: signToken(user), user });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
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

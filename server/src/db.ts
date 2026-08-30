import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SAHAAYA_DB_PATH ?? path.join(__dirname, '..', 'sahaaya.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('elderly','caregiver','healthcare')),
  language TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  region TEXT NOT NULL,
  caregiver_id TEXT NOT NULL REFERENCES users(id),
  healthcare_worker_id TEXT REFERENCES users(id),
  preferences_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cognitive_profiles (
  patient_id TEXT PRIMARY KEY REFERENCES patients(id),
  memory_score INTEGER NOT NULL,
  attention_score INTEGER NOT NULL,
  recognition_score INTEGER NOT NULL,
  pattern_score INTEGER NOT NULL,
  routine_score INTEGER NOT NULL,
  overall_engagement INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cognitive_sessions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  game_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  response_time REAL NOT NULL,
  mistakes INTEGER NOT NULL,
  completed INTEGER NOT NULL,
  domain TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL,
  date TEXT,
  adherence_rate INTEGER
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  voice_text TEXT,
  relationship TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_activities (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  activity TEXT NOT NULL,
  emoji TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  detail TEXT,
  action TEXT,
  created_at TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  client_id TEXT UNIQUE,
  patient_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  result_json TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Migration-safe column additions — safe to run against both fresh and existing
// databases. SQLite does not support IF NOT EXISTS on ALTER TABLE, so we use
// try/catch and ignore SQLITE_DUPLICATE_COLUMN errors.
const addColumnIfMissing = (table: string, column: string, definition: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (err) {
    // SQLITE_ERROR is thrown when the column already exists — ignore it.
    if (!(err as { message?: string }).message?.includes('duplicate column name')) throw err;
  }
};

// onboarding_complete: 0 = wizard not yet finished, 1 = all sections saved.
addColumnIfMissing('patients', 'onboarding_complete', 'INTEGER NOT NULL DEFAULT 0');
// pin_hash: bcrypt hash of the 4-digit PIN set during onboarding for elder login.
// NULL for caregiver/healthcare accounts — only set on system-created elder accounts.
addColumnIfMissing('users', 'pin_hash', 'TEXT');
// elder_access_id: unique access code for elder login (e.g. SAH-4821)
addColumnIfMissing('users', 'elder_access_id', 'TEXT');
try {
  db.exec(`
    UPDATE users SET elder_access_id = 'SAH-1001' WHERE email = 'maya@sahaaya.demo' AND (elder_access_id IS NULL OR elder_access_id = '');
    UPDATE users SET elder_access_id = 'SAH-1002' WHERE email = 'basanta@sahaaya.demo' AND (elder_access_id IS NULL OR elder_access_id = '');
    UPDATE users SET elder_access_id = 'SAH-1003' WHERE email = 'sita@sahaaya.demo' AND (elder_access_id IS NULL OR elder_access_id = '');
  `);
} catch {
  /* ignore */
}

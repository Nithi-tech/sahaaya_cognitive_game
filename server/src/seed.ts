// Ports src/data/demoData.ts (frontend mock fixtures) into real DB rows,
// so the same demo scenario now lives behind real auth + API calls.
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { newId } from './ids.js';

const DEMO_PASSWORD = 'demo1234';

interface SeedUser {
  id: string;
  email: string;
  name: string;
  role: 'elderly' | 'caregiver' | 'healthcare';
  language: string;
}

const users: SeedUser[] = [
  { id: 'user_elderly_1', email: 'maya@sahaaya.demo', name: 'Maya Devi', role: 'elderly', language: 'as' },
  { id: 'user_caregiver_1', email: 'priya@sahaaya.demo', name: 'Priya Devi', role: 'caregiver', language: 'en' },
  { id: 'user_hcw_1', email: 'akhil@sahaaya.demo', name: 'Dr. Akhil Sharma', role: 'healthcare', language: 'en' },
  { id: 'user_elderly_2', email: 'basanta@sahaaya.demo', name: 'Basanta Kalita', role: 'elderly', language: 'as' },
  { id: 'user_caregiver_2', email: 'rekha@sahaaya.demo', name: 'Rekha Kalita', role: 'caregiver', language: 'en' },
  { id: 'user_elderly_3', email: 'sita@sahaaya.demo', name: 'Sita Bora', role: 'elderly', language: 'as' },
  { id: 'user_caregiver_3', email: 'dipak@sahaaya.demo', name: 'Dipak Bora', role: 'caregiver', language: 'en' },
];

interface SeedPatient {
  id: string;
  userId: string;
  name: string;
  age: number;
  region: string;
  caregiverId: string;
  healthcareWorkerId: string;
  preferences: Record<string, unknown>;
  profile: { memory: number; attention: number; recognition: number; pattern: number; routine: number };
}

const patients: SeedPatient[] = [
  {
    id: 'patient_1',
    userId: 'user_elderly_1',
    name: 'Maya Devi',
    age: 72,
    region: 'Assam',
    caregiverId: 'user_caregiver_1',
    healthcareWorkerId: 'user_hcw_1',
    preferences: { preferredLanguage: 'as', preferredActivityTime: '10:00', favoriteCategory: 'family', favoriteContent: 'Music', difficulty: 'adaptive', voiceEnabled: true },
    profile: { memory: 72, attention: 84, recognition: 79, pattern: 68, routine: 88 },
  },
  {
    id: 'patient_2',
    userId: 'user_elderly_2',
    name: 'Basanta Kalita',
    age: 68,
    region: 'Assam',
    caregiverId: 'user_caregiver_2',
    healthcareWorkerId: 'user_hcw_1',
    preferences: { preferredLanguage: 'as', preferredActivityTime: '11:00', favoriteCategory: 'places', favoriteContent: 'Garden', difficulty: 'adaptive', voiceEnabled: true },
    profile: { memory: 81, attention: 78, recognition: 82, pattern: 74, routine: 85 },
  },
  {
    id: 'patient_3',
    userId: 'user_elderly_3',
    name: 'Sita Bora',
    age: 75,
    region: 'Assam',
    caregiverId: 'user_caregiver_3',
    healthcareWorkerId: 'user_hcw_1',
    preferences: { preferredLanguage: 'as', preferredActivityTime: '09:30', favoriteCategory: 'family', favoriteContent: 'Music', difficulty: 'adaptive', voiceEnabled: true },
    profile: { memory: 65, attention: 70, recognition: 68, pattern: 62, routine: 75 },
  },
];

const memoriesByPatient: Record<string, { category: string; title: string; description: string; relationship?: string; voiceText: string; notes?: string }[]> = {
  patient_1: [
    { category: 'family', title: 'Anjali', description: 'Your loving daughter', relationship: 'Daughter', voiceText: 'Anjali is your daughter. She lives in Guwahati and visits every weekend.', notes: 'She calls every evening at 7 PM.' },
    { category: 'family', title: 'Ravi', description: 'Your son who works in Bengaluru', relationship: 'Son', voiceText: 'Ravi is your son. He works as an engineer in Bengaluru.', notes: 'He visits during Bihu festival.' },
    { category: 'family', title: 'Meera', description: "Your granddaughter — Anjali's daughter", relationship: 'Granddaughter', voiceText: 'Meera is your granddaughter. She is 8 years old and loves drawing.', notes: 'She calls you Aita.' },
    { category: 'family', title: 'Priya', description: 'Your caregiver and niece', relationship: 'Caregiver / Niece', voiceText: 'Priya is your caregiver and niece. She helps you with your daily activities.' },
    { category: 'places', title: 'Home', description: 'Your home in Jorhat, Assam', voiceText: 'Your home is in Jorhat, Assam. You have lived here for 40 years.' },
    { category: 'places', title: 'Apollo Clinic', description: "Your doctor's clinic — 2km from home", voiceText: 'Your doctor, Dr. Akhil Sharma, is at Apollo Clinic on MG Road. It is about 2 km from your home.' },
    { category: 'favorites', title: 'Assam Tea', description: 'Your favourite morning ritual', voiceText: 'You love a cup of Assam tea every morning. It is your favourite way to start the day.' },
    { category: 'favorites', title: 'Bihu Music', description: 'Traditional Assamese folk music', voiceText: 'You love listening to Bihu music, especially during the Rongali Bihu festival.' },
    { category: 'favorites', title: 'Garden', description: 'Your flower garden at home', voiceText: 'You have a beautiful flower garden at your home where you grow roses, marigolds and tulsi.' },
    { category: 'dates', title: "Doctor's Appointment", description: 'Next visit: Day after tomorrow at 10 AM', voiceText: 'Your next doctor appointment with Dr. Akhil Sharma is the day after tomorrow at 10 AM.' },
    { category: 'dates', title: "Anjali's Birthday", description: 'September 14th', voiceText: "Anjali's birthday is on September 14th. She will turn 45 this year." },
    { category: 'dates', title: 'Rongali Bihu', description: 'Assamese New Year — April 14th', voiceText: 'Rongali Bihu is the Assamese New Year celebration, held every April 14th.' },
  ],
};

const activitiesTemplate: { activity: string; emoji: string; scheduledTime: string; status: string }[] = [
  { activity: 'Wake up', emoji: '🌅', scheduledTime: '07:00', status: 'completed' },
  { activity: 'Morning Tea', emoji: '🍵', scheduledTime: '07:15', status: 'completed' },
  { activity: 'Breakfast', emoji: '🍚', scheduledTime: '07:30', status: 'completed' },
  { activity: 'Morning Walk', emoji: '🚶', scheduledTime: '08:00', status: 'completed' },
  { activity: 'Morning Medicine', emoji: '💊', scheduledTime: '09:00', status: 'completed' },
  { activity: 'Brain Activity', emoji: '🧠', scheduledTime: '10:00', status: 'pending' },
  { activity: 'Drink Water', emoji: '💧', scheduledTime: '10:30', status: 'pending' },
  { activity: 'Lunch', emoji: '🍛', scheduledTime: '12:30', status: 'pending' },
  { activity: 'Rest', emoji: '😴', scheduledTime: '13:30', status: 'pending' },
  { activity: 'Afternoon Snack', emoji: '🫖', scheduledTime: '16:00', status: 'pending' },
  { activity: 'Evening Walk', emoji: '🌿', scheduledTime: '17:00', status: 'pending' },
  { activity: 'Family Call', emoji: '📱', scheduledTime: '19:00', status: 'pending' },
  { activity: 'Dinner', emoji: '🍽️', scheduledTime: '19:30', status: 'pending' },
  { activity: 'Evening Medicine', emoji: '💊', scheduledTime: '20:00', status: 'pending' },
  { activity: 'Bedtime', emoji: '🌙', scheduledTime: '21:30', status: 'pending' },
];

const remindersTemplate: { type: string; title: string; description: string; time: string; status: string; date?: string }[] = [
  { type: 'medicine', title: 'Morning Medicine', description: 'Take 2 tablets with water', time: '09:00', status: 'completed' },
  { type: 'medicine', title: 'Evening Medicine', description: 'Take 1 tablet after dinner', time: '20:00', status: 'scheduled' },
  { type: 'hydration', title: 'Drink Water', description: 'Stay hydrated', time: '10:00', status: 'completed' },
  { type: 'hydration', title: 'Drink Water', description: 'Afternoon hydration', time: '14:00', status: 'skipped' },
  { type: 'hydration', title: 'Drink Water', description: 'Evening hydration', time: '17:00', status: 'scheduled' },
  { type: 'activity', title: 'Evening Walk', description: 'A gentle 15-minute walk', time: '17:30', status: 'scheduled' },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seedSessions(patientId: string, baseAccuracy: number) {
  const gameTypes = ['memory_match', 'object_recognition', 'attention', 'pattern', 'routine_recall'];
  const domains = ['memory', 'recognition', 'attention', 'pattern', 'routine'];
  const difficulties = ['easy', 'medium', 'challenging'];
  const today = new Date();

  for (let day = 13; day >= 0; day--) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const numSessions = day === 0 ? 2 : randomInt(1, 4);
    for (let s = 0; s < numSessions; s++) {
      const idx = s % 5;
      const accuracy = Math.max(40, Math.min(99, baseAccuracy + randomInt(-15, 15)));
      const timestamp = new Date(date.getTime() + s * 3600000).toISOString();
      db.prepare(
        `INSERT INTO cognitive_sessions (id, patient_id, game_type, difficulty, score, accuracy, response_time, mistakes, completed, domain, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(newId('session'), patientId, gameTypes[idx], difficulties[randomInt(0, 1)], accuracy, accuracy, 3 + Math.random() * 5, Math.floor((100 - accuracy) / 20), 1, domains[idx], timestamp);
    }
  }
}

function seed() {
  const alreadySeeded = db.prepare('SELECT id FROM users WHERE email = ?').get('maya@sahaaya.demo');
  if (alreadySeeded) {
    console.log('Database already seeded — skipping. Delete server/sahaaya.db to reseed from scratch.');
    return;
  }

  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, name, role, language) VALUES (?, ?, ?, ?, ?, ?)');
  for (const u of users) insertUser.run(u.id, u.email, passwordHash, u.name, u.role, u.language);

  const insertPatient = db.prepare(
    'INSERT INTO patients (id, user_id, name, age, language, region, caregiver_id, healthcare_worker_id, preferences_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertProfile = db.prepare(
    'INSERT INTO cognitive_profiles (patient_id, memory_score, attention_score, recognition_score, pattern_score, routine_score, overall_engagement, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );

  for (const p of patients) {
    insertPatient.run(p.id, p.userId, p.name, p.age, 'as', p.region, p.caregiverId, p.healthcareWorkerId, JSON.stringify(p.preferences));
    const overall = Math.round((p.profile.memory + p.profile.attention + p.profile.recognition + p.profile.pattern + p.profile.routine) / 5);
    insertProfile.run(p.id, p.profile.memory, p.profile.attention, p.profile.recognition, p.profile.pattern, p.profile.routine, overall, new Date().toISOString());
    seedSessions(p.id, overall);
  }

  const insertMemory = db.prepare(
    `INSERT INTO memories (id, patient_id, category, title, description, image_url, audio_url, voice_text, relationship, notes, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`,
  );
  for (const m of memoriesByPatient.patient_1) {
    insertMemory.run(newId('mem'), 'patient_1', m.category, m.title, m.description, m.voiceText, m.relationship ?? null, m.notes ?? null, new Date().toISOString());
  }

  const insertReminder = db.prepare(
    'INSERT INTO reminders (id, patient_id, type, title, description, time, status, date, adherence_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  for (const r of remindersTemplate) {
    insertReminder.run(newId('rem'), 'patient_1', r.type, r.title, r.description, r.time, r.status, null, 80);
  }
  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 2);
  insertReminder.run(
    newId('rem'),
    'patient_1',
    'appointment',
    "Doctor's Visit",
    'Dr. Akhil Sharma — Apollo Clinic',
    '10:00',
    'scheduled',
    appointmentDate.toISOString().split('T')[0],
    null,
  );

  const today = new Date().toISOString().split('T')[0];
  const insertActivity = db.prepare(
    'INSERT INTO daily_activities (id, patient_id, activity, emoji, scheduled_time, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  for (const patient of patients) {
    for (const a of activitiesTemplate) {
      insertActivity.run(newId('act'), patient.id, a.activity, a.emoji, a.scheduledTime, patient.id === 'patient_1' ? a.status : 'pending', today);
    }
  }

  const insertAlert = db.prepare(
    'INSERT INTO alerts (id, patient_id, type, severity, message, detail, action, created_at, resolved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  insertAlert.run(
    newId('alert'),
    'patient_1',
    'hydration',
    'medium',
    'Hydration reminders missed 3 times this week.',
    'The patient missed afternoon hydration reminders on Monday, Wednesday, and Thursday.',
    'Encourage the patient to keep a water bottle nearby. Consider adjusting reminder times.',
    new Date(Date.now() - 86400000).toISOString(),
    0,
  );
  insertAlert.run(
    newId('alert'),
    'patient_1',
    'medicine',
    'low',
    'Medication reminders completed successfully.',
    'The patient completed all scheduled medication reminders this week.',
    'Great engagement with medication reminders. Continue current schedule.',
    new Date(Date.now() - 172800000).toISOString(),
    1,
  );

  console.log('Seed complete. Demo accounts (password: demo1234):');
  for (const u of users) console.log(`  ${u.email}  (${u.role})`);
}

seed();

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '..', 'test.db');
for (const ext of ['', '-wal', '-shm']) {
  if (fs.existsSync(TEST_DB + ext)) fs.unlinkSync(TEST_DB + ext);
}
process.env.SAHAAYA_DB_PATH = TEST_DB;
process.env.NODE_ENV = 'test';

const { app } = await import('./index.js');
await import('./seed.js');

let elderlyToken: string;
let caregiverToken: string;
let otherCaregiverToken: string;

beforeAll(async () => {
  const login = async (email: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'demo1234' });
    return res.body.token as string;
  };
  elderlyToken = await login('maya@sahaaya.demo');
  caregiverToken = await login('priya@sahaaya.demo');
  otherCaregiverToken = await login('rekha@sahaaya.demo');
});

describe('auth', () => {
  it('rejects bad credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'maya@sahaaya.demo', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('registers a new user and logs in', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newuser@sahaaya.demo', password: 'pw123456', name: 'New User', role: 'caregiver' });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTruthy();
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
  });
});

describe('RBAC / patient isolation', () => {
  it('lets a caregiver see their own patient', async () => {
    const res = await request(app).get('/api/patients').set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.patients.map((p: { id: string }) => p.id)).toEqual(['patient_1']);
  });

  it('blocks a caregiver from another caregiver\'s patient', async () => {
    const res = await request(app).get('/api/patients/patient_1').set('Authorization', `Bearer ${otherCaregiverToken}`);
    expect(res.status).toBe(403);
  });

  it('lets the elderly user see only their own patient record', async () => {
    const res = await request(app).get('/api/patients').set('Authorization', `Bearer ${elderlyToken}`);
    expect(res.body.patients.map((p: { id: string }) => p.id)).toEqual(['patient_1']);
  });
});

describe('cognitive sessions + adaptive profile', () => {
  it('recomputes the domain score after a session', async () => {
    const before = await request(app).get('/api/sessions/patient_1/profile').set('Authorization', `Bearer ${caregiverToken}`);
    const beforeScore = before.body.profile.memoryScore;

    const res = await request(app)
      .post('/api/sessions/patient_1')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ gameType: 'memory_match', difficulty: 'medium', accuracy: 95, responseTime: 3, mistakes: 0, completed: true, domain: 'memory' });

    expect(res.status).toBe(201);
    expect(res.body.profile.memoryScore).not.toBe(beforeScore);
    expect(res.body.recommendation).toBeTruthy();
  });

  it('rejects a session for a patient the caller cannot access', async () => {
    const res = await request(app)
      .post('/api/sessions/patient_1')
      .set('Authorization', `Bearer ${otherCaregiverToken}`)
      .send({ gameType: 'memory_match', difficulty: 'medium', accuracy: 95, domain: 'memory' });
    expect(res.status).toBe(403);
  });
});

describe('reminder lifecycle', () => {
  it('transitions status and recomputes adherence', async () => {
    const list = await request(app).get('/api/reminders/patient_1').set('Authorization', `Bearer ${caregiverToken}`);
    const reminder = list.body.reminders.find((r: { status: string }) => r.status === 'scheduled');
    expect(reminder).toBeTruthy();

    const res = await request(app)
      .patch(`/api/reminders/patient_1/${reminder.id}/status`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.reminder.status).toBe('completed');
  });

  it('rejects an invalid status', async () => {
    const list = await request(app).get('/api/reminders/patient_1').set('Authorization', `Bearer ${caregiverToken}`);
    const reminder = list.body.reminders[0];
    const res = await request(app)
      .patch(`/api/reminders/patient_1/${reminder.id}/status`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ status: 'not-a-real-status' });
    expect(res.status).toBe(400);
  });
});

describe('offline sync replay', () => {
  it('replays a batch of queued mutations and reports per-item results', async () => {
    const activities = await request(app)
      .get('/api/daily-activities/patient_1')
      .set('Authorization', `Bearer ${caregiverToken}`);
    const pending = activities.body.activities.find((a: { status: string }) => a.status === 'pending');

    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        items: [
          { id: 'q1', patientId: 'patient_1', actionType: 'setDailyActivityStatus', payload: { activityId: pending.id, status: 'completed' } },
          { id: 'q2', patientId: 'patient_1', actionType: 'addMemory', payload: { category: 'family', title: 'Test Memory' } },
          { id: 'q3', patientId: 'patient_2', actionType: 'addMemory', payload: { category: 'family', title: 'Should be forbidden' } },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([
      { id: 'q1', status: 'synced' },
      { id: 'q2', status: 'synced' },
      { id: 'q3', status: 'failed', error: expect.any(String) },
    ]);
  });
});

describe('patient preferences (voice settings persistence)', () => {
  it('persists voice preferences via direct PATCH', async () => {
    const res = await request(app)
      .patch('/api/patients/patient_1')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ preferences: { preferredLanguage: 'en', preferredActivityTime: '10:00', favoriteCategory: 'family', favoriteContent: 'Music', difficulty: 'adaptive', voiceEnabled: true, voiceLanguage: 'as', voiceSpeed: 'slow', voiceVolume: 0.8, spokenFeedback: true } });
    expect(res.status).toBe(200);
    expect(res.body.patient.preferences.voiceLanguage).toBe('as');
    expect(res.body.patient.preferences.voiceSpeed).toBe('slow');
  });

  it('persists voice preferences via offline sync replay', async () => {
    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        items: [
          { id: 'p1', patientId: 'patient_1', actionType: 'updatePatientPreferences', payload: { voiceEnabled: false, voiceSpeed: 'fast' } },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([{ id: 'p1', status: 'synced' }]);

    const check = await request(app).get('/api/patients/patient_1').set('Authorization', `Bearer ${caregiverToken}`);
    expect(check.body.patient.preferences.voiceSpeed).toBe('fast');
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '..', 'onboarding-test.db');
for (const ext of ['', '-wal', '-shm']) {
  if (fs.existsSync(TEST_DB + ext)) fs.unlinkSync(TEST_DB + ext);
}
process.env.SAHAAYA_DB_PATH = TEST_DB;
process.env.NODE_ENV = 'test';

const { app } = await import('./index.js');
await import('./seed.js');

let caregiverToken: string;
let otherCaregiverToken: string;
let elderToken: string;
let createdPatientId: string;

beforeAll(async () => {
  const login = async (email: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'demo1234' });
    return res.body.token as string;
  };
  caregiverToken = await login('priya@sahaaya.demo');
  otherCaregiverToken = await login('rekha@sahaaya.demo');
  elderToken = await login('maya@sahaaya.demo');
});

describe('POST /api/patients — caregiver creates a patient', () => {
  it('creates a patient + elder user when caregiver provides valid data', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ name: 'Test Elder', age: 70, region: 'Assam', language: 'en', pin: '1234' });

    expect(res.status).toBe(201);
    expect(res.body.patient).toBeDefined();
    expect(res.body.patient.name).toBe('Test Elder');
    expect(res.body.patient.onboardingComplete).toBe(false);
    expect(res.body.pinHint).toBe('1234');
    expect(res.body.elderEmail).toContain('@sahaaya.internal');

    createdPatientId = res.body.patient.id;
  });

  it('rejects invalid PIN (not 4 digits)', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ name: 'Bad PIN Elder', age: 65, region: 'Assam', language: 'en', pin: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pin/i);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ name: 'No Age', region: 'Assam', pin: '5678' });
    expect(res.status).toBe(400);
  });

  it('blocks a non-caregiver from creating a patient', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${elderToken}`)
      .send({ name: 'Should Fail', age: 68, region: 'Assam', pin: '0000' });
    expect(res.status).toBe(403);
  });

  it('returns the new patient in caregiver patient list', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.patients.map((p: { id: string }) => p.id);
    expect(ids).toContain(createdPatientId);
  });
});

describe('GET /api/onboarding/:patientId — progress check', () => {
  it('returns empty progress initially', async () => {
    const res = await request(app)
      .get(`/api/onboarding/${createdPatientId}`)
      .set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.onboardingComplete).toBe(false);
    for (const section of ['people', 'favorites', 'routine', 'cultural', 'health', 'emotional']) {
      expect(res.body.progress[section]).toBeNull();
    }
  });

  it('blocks another caregiver from reading progress', async () => {
    const res = await request(app)
      .get(`/api/onboarding/${createdPatientId}`)
      .set('Authorization', `Bearer ${otherCaregiverToken}`);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/onboarding/:patientId/:section — save sections', () => {
  it('saves the people section', async () => {
    const people = [
      { name: 'Anjali', callsBy: 'Amma', relationship: 'Daughter', photoUrl: null, greetingAudioUrl: null },
    ];
    const res = await request(app)
      .patch(`/api/onboarding/${createdPatientId}/people`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ data: people });

    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(true);
    expect(res.body.section).toBe('people');
  });

  it('saves the favorites section', async () => {
    const res = await request(app)
      .patch(`/api/onboarding/${createdPatientId}/favorites`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ data: { food: 'Rice', colour: '#FF6B35', music: 'Bihu', place: 'Jorhat' } });
    expect(res.status).toBe(200);
  });

  it('saves the routine section', async () => {
    const res = await request(app)
      .patch(`/api/onboarding/${createdPatientId}/routine`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ data: { wakeTime: '06:30', breakfastTime: '07:30', lunchTime: '12:30', dinnerTime: '19:30', sleepTime: '21:00', rituals: 'Morning prayer' } });
    expect(res.status).toBe(200);
  });

  it('saves the cultural section', async () => {
    const res = await request(app)
      .patch(`/api/onboarding/${createdPatientId}/cultural`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ data: { festivals: ['Bihu', 'Durga Puja'], traditionalObjects: ['Jaapi', 'Mekhela'], dialect: 'Assamese' } });
    expect(res.status).toBe(200);
  });

  it('saves the health section (caregiver-only sensitive data)', async () => {
    const res = await request(app)
      .patch(`/api/onboarding/${createdPatientId}/health`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ data: { medicines: [{ name: 'Metformin', time: '08:00' }], mobilityIssues: 'Mild knee pain', diet: 'Low sugar' } });
    expect(res.status).toBe(200);
  });

  it('saves the emotional section', async () => {
    const res = await request(app)
      .patch(`/api/onboarding/${createdPatientId}/emotional`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ data: { calming: 'Hearing granddaughter sing', sounds: 'nature', images: 'garden flowers', phrases: ['All is well', 'Anjali is coming'] } });
    expect(res.status).toBe(200);
  });

  it('rejects an invalid section name', async () => {
    const res = await request(app)
      .patch(`/api/onboarding/${createdPatientId}/nonexistent`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ data: {} });
    expect(res.status).toBe(400);
  });

  it('blocks a non-caregiver from saving onboarding sections', async () => {
    const res = await request(app)
      .patch(`/api/onboarding/${createdPatientId}/favorites`)
      .set('Authorization', `Bearer ${elderToken}`)
      .send({ data: { food: 'Puri' } });
    expect(res.status).toBe(403);
  });

  it('re-GET shows all saved sections filled', async () => {
    const res = await request(app)
      .get(`/api/onboarding/${createdPatientId}`)
      .set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.status).toBe(200);
    for (const section of ['people', 'favorites', 'routine', 'cultural', 'health', 'emotional']) {
      expect(res.body.progress[section]).not.toBeNull();
    }
  });
});

describe('PATCH /api/patients/:id/onboarding-complete — mark done', () => {
  it('marks onboarding complete', async () => {
    const res = await request(app)
      .patch(`/api/patients/${createdPatientId}/onboarding-complete`)
      .set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.patient.onboardingComplete).toBe(true);
  });

  it('re-GET onboarding progress shows onboardingComplete = true', async () => {
    const res = await request(app)
      .get(`/api/onboarding/${createdPatientId}`)
      .set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.body.onboardingComplete).toBe(true);
  });
});

describe('POST /api/auth/pin-login — elder PIN authentication', () => {
  it('logs in successfully with correct PIN', async () => {
    const res = await request(app)
      .post('/api/auth/pin-login')
      .send({ patientId: createdPatientId, pin: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('elderly');
    expect(res.body.user.name).toBe('Test Elder');
  });

  it('returns 401 for wrong PIN', async () => {
    const res = await request(app)
      .post('/api/auth/pin-login')
      .send({ patientId: createdPatientId, pin: '9999' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrect pin/i);
  });

  it('returns 404 for unknown patient', async () => {
    const res = await request(app)
      .post('/api/auth/pin-login')
      .send({ patientId: 'patient_nonexistent', pin: '1234' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when body is missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/pin-login')
      .send({ patientId: createdPatientId });
    expect(res.status).toBe(400);
  });

  it('elder account can access their own patient data after PIN login', async () => {
    const loginRes = await request(app)
      .post('/api/auth/pin-login')
      .send({ patientId: createdPatientId, pin: '1234' });
    const token = loginRes.body.token;

    const patientsRes = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`);
    expect(patientsRes.status).toBe(200);
    const ids = patientsRes.body.patients.map((p: { id: string }) => p.id);
    expect(ids).toContain(createdPatientId);
  });

  it('seeded elder accounts without pin_hash cannot use PIN login', async () => {
    // patient_1 (Maya Devi) was seeded without a pin_hash — PIN login must be rejected
    const res = await request(app)
      .post('/api/auth/pin-login')
      .send({ patientId: 'patient_1', pin: '0000' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/not enabled/i);
  });
});

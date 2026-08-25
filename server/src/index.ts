import express from 'express';
import cors from 'cors';
import './db.js';
import { authRouter } from './routes/auth.js';
import { patientsRouter } from './routes/patients.js';
import { sessionsRouter } from './routes/sessions.js';
import { remindersRouter } from './routes/reminders.js';
import { memoriesRouter } from './routes/memories.js';
import { dailyActivitiesRouter } from './routes/dailyActivities.js';
import { alertsRouter } from './routes/alerts.js';
import { syncRouter } from './routes/sync.js';

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/daily-activities', dailyActivitiesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/sync', syncRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT ?? 4000;
if (process.env.NODE_ENV !== 'test') {
  // Idempotent — a fresh deploy (empty DB) seeds the demo accounts automatically;
  // an existing DB is left untouched. Keeps a first deploy to Render/Fly/etc. zero-touch.
  await import('./seed.js');
  app.listen(PORT, () => console.log(`Sahaaya API listening on http://localhost:${PORT}`));
}

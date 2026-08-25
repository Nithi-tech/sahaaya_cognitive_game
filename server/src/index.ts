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
app.use((err: Error & { status?: number; statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  // express.json() throws a SyntaxError with .status = 400 on malformed request
  // bodies — surface that as the client error it is, not a generic 500. Any
  // other (genuinely unexpected) error still gets a safe, non-leaking message.
  const status = err.status ?? err.statusCode;
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({ error: err.message || 'Bad request' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT ?? 4000;
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.SAHAAYA_JWT_SECRET) {
    console.warn(
      '\n⚠️  SAHAAYA_JWT_SECRET is not set — using an insecure, publicly-known default.\n' +
      '    Anyone can forge a valid login token. Set SAHAAYA_JWT_SECRET before deploying for real use.\n',
    );
  }
  // Idempotent — a fresh deploy (empty DB) seeds the demo accounts automatically;
  // an existing DB is left untouched. Keeps a first deploy to Render/Fly/etc. zero-touch.
  await import('./seed.js');
  app.listen(PORT, () => console.log(`Sahaaya API listening on http://localhost:${PORT}`));
}

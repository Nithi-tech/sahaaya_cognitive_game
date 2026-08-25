# Sahaaya — Architecture

## Stack

- **Frontend**: React 19 + TypeScript + Vite, no external state library. `react-router-dom`
  for routing, `recharts` for charts, `html2canvas`+`jspdf` for report export.
- **Backend**: Express 5 + TypeScript, `better-sqlite3` (synchronous, file-based SQLite),
  `jsonwebtoken` + `bcryptjs` for auth.
- **Voice**: browser Web Speech API (`SpeechSynthesis` for TTS, `SpeechRecognition` for
  ASR) behind a provider abstraction — see `src/services/voice/`.

## Three role-scoped experiences, one backend

`src/App.tsx` picks a route tree based on `user.role` (`elderly` | `caregiver` |
`healthcare`), each with its own pages under `src/pages/<Role>/`. All three talk to the
same Express API and the same `patients` table — a patient row has a `user_id` (the
elderly account that owns it), `caregiver_id`, and an optional `healthcare_worker_id`.
Every patient-scoped route is gated by `requirePatientAccess`
(`server/src/auth.ts`), which checks the authenticated user's role against those three
columns before allowing access — this is the *only* authorization layer; there is no
separate role-based restriction on top of it (see `FULL_SYSTEM_AUDIT.md` section G for why
that's a known, deliberately-undecided gap).

## Data flow

```
React component
  → src/store/AppContext.tsx (mutator, e.g. addReminder)
      → online?  → src/api/client.ts → Express route → server/src/mutations.ts → SQLite
                                                                                     ↓
      → offline? → optimistic local state update + OfflineContext.addToQueue()
                       → (on reconnect) OfflineContext.drainQueue() → POST /api/sync
                           → server/src/routes/sync.ts → same mutations.ts functions
```

The key architectural decision: **direct REST routes and the offline-sync replay route
call the exact same `mutations.ts` functions**, so a mutation only needs its validation
and authorization logic written once. This is also why some historical bugs (see
`BUGS_FIXED.md`'s "Data integrity" section) affected both paths identically — fixing the
shared function fixed both.

Offline sync is now idempotent: each queued action carries the client-generated queue-item
id, and `sync_log.client_id` (UNIQUE) lets a replayed batch return its cached result
instead of re-applying the mutation a second time.

## Adaptive difficulty

Two independent implementations of the same scoring logic exist by design, not accident:
`src/engines/adaptiveDifficulty.ts` (used by the *offline* fallback path in `AppContext`,
so difficulty can still adapt with zero network) and `server/src/adaptive.ts` (used by the
*online* path, the authoritative one). They must be kept in parity by hand — there's no
shared source and no parity test; a change to one without the other will make behavior
differ depending on whether a session was recorded online or offline (documented, not
fixed, in the audit).

## Voice architecture

Built to be provider-agnostic from day one: `src/services/voice/VoiceService.ts` is a
singleton that owns playback state and talks to a `VoiceProvider` interface
(`BrowserTTSProvider` today; Bhashini/AI4Bharat/native providers can be swapped in without
touching any game component). `useQuizVoice()` + `<QuestionNarrator>` are the only
integration points every game uses — no game calls the Web Speech API directly.

## Testing

- `server/src/index.test.ts` — integration tests against a real (temp-file) SQLite DB and
  the real Express app via `supertest`. 22 tests: auth, RBAC/patient isolation, sessions,
  reminders, offline sync (including idempotency), voice preference persistence.
- `src/services/voice/*.test.ts` — unit tests for the voice layer against fake providers.
- No frontend component/integration test runner is configured (no React Testing Library)
  — UI-level bugs in this pass were caught by live browser QA (Playwright, used ad hoc
  during development, not checked into the repo) rather than automated component tests.
  See `QA_REPORT.md`.

## Deployment

Frontend → Vercel (static SPA, `vercel.json` handles client-side routing). Backend →
Render (`render.yaml`, free-tier compatible — no persistent disk, so the SQLite file lives
on the container's local filesystem and resets on redeploy; the server re-seeds itself
automatically on boot). Full instructions in the repo root `README.md`.

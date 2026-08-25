# Sahaaya

AI cognitive companion for elderly dementia care — a React/TypeScript frontend backed by a real Express + SQLite API.

## Architecture

- `src/` — React 19 + Vite frontend (elderly / caregiver / healthcare experiences).
- `server/` — Express + TypeScript + SQLite (better-sqlite3) backend: JWT auth, role-based access control, cognitive session scoring, reminders, memories, alerts, and offline-sync replay.

## Running locally

```bash
# 1. Backend
cd server
npm install
npm run seed   # creates server/sahaaya.db with demo accounts (password: demo1234)
npm run dev    # http://localhost:4000

# 2. Frontend (separate terminal)
cd ..
npm install
npm run dev    # http://localhost:5173
```

The frontend reads the API base URL from `VITE_API_URL` (see `.env`, defaults to `http://localhost:4000/api`).

### Demo accounts (password: `demo1234`)

| Role | Email |
|---|---|
| Elderly (Maya Devi) | maya@sahaaya.demo |
| Caregiver (Priya Devi) | priya@sahaaya.demo |
| Healthcare (Dr. Akhil Sharma) | akhil@sahaaya.demo |
| Elderly (Basanta Kalita) | basanta@sahaaya.demo |
| Caregiver (Rekha Kalita) | rekha@sahaaya.demo |
| Elderly (Sita Bora) | sita@sahaaya.demo |
| Caregiver (Dipak Bora) | dipak@sahaaya.demo |

The landing page's quick-login buttons sign in as the first three accounts automatically.

## Testing

```bash
cd server && npm test    # API + RBAC + adaptive-engine + offline-sync tests (vitest)
cd .. && npm run build   # frontend typecheck + build
npm run test             # frontend unit tests (voice service, narration) — vitest
npm run lint             # oxlint
```

## Deploying

The frontend (`/`) and backend (`/server`) deploy to two different places, because the
backend uses a file-based SQLite database (`better-sqlite3`) that needs a real, persistent
disk — something Vercel's serverless functions don't provide (their filesystem is
ephemeral). So: **backend → Render** (persistent disk, free tier), **frontend → Vercel**.

### 1. Backend → Render

This repo includes `render.yaml` at the root, so Render can set everything up from one click:

1. Push this repo to GitHub (if it isn't already).
2. In the [Render dashboard](https://dashboard.render.com), **New → Blueprint**, pick this repo.
   Render reads `render.yaml` and creates a `sahaaya-api` web service with:
   - a 1 GB persistent disk mounted at `/data`
   - `SAHAAYA_DB_PATH=/data/sahaaya.db` (so the SQLite file survives restarts/redeploys)
   - `SAHAAYA_JWT_SECRET` auto-generated (never falls back to the insecure dev default)
3. Deploy. The server seeds its own demo accounts automatically on first boot against the
   empty disk (see `server/src/index.ts` — idempotent, safe on every restart).
4. Note the resulting URL, e.g. `https://sahaaya-api.onrender.com`. Confirm it's alive:
   `curl https://sahaaya-api.onrender.com/api/health` → `{"ok":true}`.

No Blueprint access, or prefer manual setup? Any Node host with a persistent disk works
(Render's dashboard "New Web Service" flow, Railway, Fly.io, a VPS): root directory
`server`, build command `npm install && npm run build`, start command `npm run start`,
and set `SAHAAYA_DB_PATH` to a path on persistent storage plus a strong `SAHAAYA_JWT_SECRET`.

> **Check current pricing before deploying.** Persistent disks have historically required
> a paid instance tier on Render (not the free plan) — `render.yaml` here requests `plan:
> free`, which Render may reject or silently require an upgrade for. Check Render's current
> pricing page and bump `plan:` in `render.yaml` (or in the dashboard) if needed.

### 2. Frontend → Vercel

This repo includes `vercel.json` at the root (SPA rewrites so React Router's client-side
routes don't 404 on refresh).

1. In the [Vercel dashboard](https://vercel.com/new), import this repo. Root directory:
   the repo root (not `server`) — Vercel auto-detects the Vite framework preset.
2. Add one environment variable before deploying: **`VITE_API_URL`** = your Render URL
   from step above, with `/api` on the end — e.g. `https://sahaaya-api.onrender.com/api`
   (see `.env.example`). Without this it falls back to `http://localhost:4000/api`, which
   only works when you're running the backend locally too.
3. Deploy. Vercel builds with `npm run build` and serves `dist/`.

Using the Vercel CLI instead of the dashboard:

```bash
npm i -g vercel
vercel login                 # opens a browser / sends an email link — this step is yours to do
vercel                        # links + deploys a preview
vercel env add VITE_API_URL production   # paste your Render API URL when prompted
vercel --prod                 # deploy to production with the env var applied
```

### After deploying

- Demo accounts (below) work immediately — the backend seeds itself.
- If you rotate `SAHAAYA_JWT_SECRET` or wipe the disk, existing logged-in sessions on the
  frontend become invalid; users just log in again.
- CORS is wide open (`cors()` with no origin restriction) so the Vercel frontend can reach
  the Render backend regardless of preview-deployment URLs; tighten it in
  `server/src/index.ts` if you want to lock it to your production domain.

# Sahaaya — Full System Audit

Conducted 2026-08-25. Method: four parallel code-reading audits (elderly frontend flows,
caregiver/healthcare frontend flows, backend API/DB/auth, frontend↔backend integration +
offline sync + adaptive engine) cross-checked against live runs of the app (both dev
servers, real login, real gameplay, real API calls) via a Chromium driver. Every finding
below was traced to specific file:line locations before being trusted; a per-finding
status shows what happened to it in this pass. See `BUGS_FIXED.md` for the fix details and
`FEATURE_STATUS.md` for what's still open.

Status legend: ✅ fixed this pass · 📋 documented, deferred (see reasoning below) · ✔️ audited, found sound

## A. Architecture

React 19 + TypeScript + Vite SPA (`src/`) talking to an Express + TypeScript + SQLite
(`better-sqlite3`) API (`server/`) over JWT-authenticated REST. Three role-scoped route
trees (elderly / caregiver / healthcare) share one backend and one patient data model.
State: three React contexts (`AuthContext`, `AppContext`, `OfflineContext`) — no external
state library, which is appropriate at this scope. **Status: ✔️ sound** — layering is
clear, no circular dependencies, no god-objects found.

## B. Frontend

6 cognitive games share no common lifecycle abstraction beyond the voice layer
(`useQuizVoice`/`QuestionNarrator`, built in an earlier session) — each hand-rolls its own
question/scoring/timer logic, which produced real duplicated bugs (the setTimeout-leak
was independently present in 3 files; padding/styling drift was independently present in
6). **Status: ✅ the specific bugs fixed; the underlying duplication itself is not
refactored** — see `FEATURE_STATUS.md`'s "Game generation engine" entry for why a real
`GameDefinition` abstraction was scoped out rather than attempted shallowly.

## C. Backend

Route → mutation → DB layering is consistent and shared correctly between direct REST
routes and the offline-sync replay path (`server/src/mutations.ts`), which is the right
architecture — but that sharing also meant a gap in one layer (missing `patient_id`
re-scoping on two SELECTs) applied to *both* paths identically. **Status: ✅ fixed**
(see Security below). Validation was present on some mutations (`applyReminderStatus`,
`applyDailyActivityStatus`) but not others (`applySession` accepted any string for
`gameType`/`difficulty`/`domain`). **Status: ✅ fixed.**

## D. Database

Schema is coherent, uses `FOREIGN KEY` correctly on every patient-scoped table except
`sync_log.patient_id` (unreferenced — plausibly intentional, so a failed/forbidden sync
attempt against a bogus id can still be logged; **📋 left as-is**, flagged for a product
decision rather than guessed at). Timestamp formats are inconsistent: `datetime('now')`
(space-separated, no timezone) on `users`/`patients`/`sync_log` vs. app-set
`new Date().toISOString()` on `cognitive_sessions`/`memories`/`alerts`. **📋 documented,
not fixed** — changing a live schema's timestamp format is a real migration, out of scope
for this pass; noted as a backlog item. No indexes exist on any `patient_id` column —
fine at demo scale (dozens of rows), will matter at real scale. **📋 documented, not
fixed** — premature at current data volume.

## E. API

One dead-but-harmless route found (`PATCH /api/memories/:id` — edit memory — has no
frontend caller and mass-assigns `req.body` without validation). **📋 documented, not
wired up** — building the "Edit Memory" UI to use it is a real feature addition, not a bug
fix; see `FEATURE_STATUS.md`. `DELETE` routes for reminders/memories are similarly
unused by the frontend (no delete UI exists for either) — **📋 same reasoning.**

## F. Authentication

Login/register/JWT verification all work correctly. Two real gaps: (1) the `SAHAAYA_JWT_SECRET`
fallback is a hardcoded, publicly-known string with no warning if a deploy forgets to set
it — **✅ fixed**, now warns loudly on boot; the Render deploy config already
auto-generates a real one. (2) Email wasn't normalized (case-sensitive, untrimmed),
so `Maya@X.com` and `maya@x.com` could register as two accounts — **✅ fixed.**

## G. Authorization

Two IDOR-class bugs (see Security below) — **✅ fixed.** One structural gap: `requireRole`
exists in `server/src/auth.ts` but is never actually applied anywhere, so authorization is
enforced only at the patient-ownership level (`requirePatientAccess`), not the
role level — e.g. nothing currently stops an `elderly`-role token from calling
`PATCH /alerts/.../resolve`, an action the UI only ever exposes to caregivers.
**📋 documented, not fixed.** This isn't a shallow one-line fix: the exact intended
per-route role matrix isn't documented anywhere in the product, and guessing it wrong
risks breaking legitimate elderly self-service flows (recording their own sessions,
updating their own reminder status, editing their own voice preferences — all of which
*must* stay open to the `elderly` role). A wrong guess here would be worse than the
current gap. See `FEATURE_STATUS.md` for the recommended next step (write the permission
matrix explicitly, then apply `requireRole` route-by-route against it).

## H. State management

One real bug: `OfflineContext.tsx`'s `drainQueue` ran its network call and side effects
*inside* a `setState` updater function, which React (correctly) may invoke more than once
under StrictMode — risking two concurrent `/sync` POSTs for the same batch.
**✅ fixed** (rewritten to read a ref instead of abusing the updater).

## I. UI/UX

See `UI_UX_REDESIGN.md` for the full account of what changed. Headline finding: **the
elderly user had no way to log out or switch role anywhere in the app** — confirmed by
grepping every elderly route for `useAuth().logout` (zero hits) and tracing `ElderlyNav`'s
four tabs (Home/Activities/My Day/Talk — none of them a settings/profile destination).
**✅ fixed** — this was the one explicitly-scoped, non-negotiable ask in this pass.

## J. Accessibility

Real, fixable gaps found and fixed: two keyboard-untrappable click targets (`<tr onClick>`
in the healthcare patient table, `<div onClick>` for the caregiver alert banner) that were
completely unreachable without a mouse; color-only correct/incorrect indication in two of
six games (the other four already used a ✓/✗ glyph); three touch targets under the ~44px
guideline; one aria-label that read out the raw answer text instead of describing the
button's action. **✅ all fixed.** Not attempted: a full WCAG pass (focus-visible outlines,
skip links, screen-reader landmark regions) — genuinely out of scope for this pass's time
budget; **📋 documented.**

## K. Localization

Every translation key used across the elderly pages/components has a matching entry for
both `en` and `as` — no raw-key leakage found. **Status: ✔️ sound**, no action needed.

## L. Voice

Built and audited in an earlier session (see prior conversation — voice architecture,
provider abstraction, per-game narration). This pass found one real regression risk in
it: `listenOnce()` (the ASR/"Talk to Sahaaya" listener) never settles its promise if the
browser fires `onend` without a prior `onresult`/`onerror` — some browsers do this on
silence — permanently disabling the mic button with no recovery short of a reload.
**✅ fixed** (now rejects on a bare `onend`).

## M. Cognitive games

All 6 existing games (Memory Match, Object Recognition, Attention, Pattern, Routine
Recall, Family & Faces) work correctly end-to-end — verified live, not just read. Three
real bugs found and fixed: a dead ternary in `AttentionGame` (`difficulty === 'easy' ? 3
: 3` — always 3, clearly meant to vary), an un-cleared `setTimeout` in three games that
could fire `onComplete` *after* the user had already navigated away (yanking them into a
result screen they didn't ask for), and non-randomized (fixed-slice) distractor selection
in `MemoryMatchGame` making wrong answers predictable across replays. **✅ all fixed.**
New games (Sequence Builder, Sound Recognition, etc.) — **📋 not implemented**, see
`FEATURE_STATUS.md` for why.

## N. AI / adaptive engine

Two real bugs. (1) `responseTime` is measured as *total game time* everywhere it's
computed, but `computeNextDifficulty`'s "increase difficulty" branch only fires when
`responseTime <= 5` seconds — for any multi-question game that's essentially
unreachable, meaning difficulty can go down but almost never up regardless of how well a
patient performs. **📋 documented, not fixed** — the correct fix (measuring true
per-answer response time) requires each game to track and report per-answer timing
individually, a real per-game change to scoring instrumentation, not a one-line patch;
flagged as the highest-value follow-up in `FEATURE_STATUS.md`. (2) The offline path
(`AppContext.tsx`) discards the server's returned recommendation and independently
recomputes one from `cognitiveProfile` state that can still be stale — **✅ fixed**, the
authoritative server recommendation is now stored and preferred.

## O. Memory companion

Works correctly for browsing; add/view flow is solid. No edit/delete UI exists (routes
exist server-side but are unused) — **📋 documented**, a real feature gap not a bug.

## P. Reminder engine

One real bug: tapping "Later" set status to `'delayed'`, but the card only checked for
`'skipped'` to show any different state — so the user got **zero visible feedback** that
their tap registered, and the reminder silently dropped out of both the "done" and
"upcoming" header counts. **✅ fixed.**

## Q. Offline mode

Core optimistic-update + queue + reconnect-replay flow is real and works (verified by
existing tests). One real correctness gap found: a replayed sync batch had no
idempotency — if a client resent an already-applied batch (e.g. reconnect race), the
mutation would run a second time, creating a duplicate record. **✅ fixed** — sync_log
now keys on the client's own queue-item id and returns the cached result on a repeat,
verified with a new test that submits the same item twice and confirms only one row is
created.

## R. Sync

The server now also returns the created/updated resource per synced item (previously
returned only `{id, status}`), so the client *can* reconcile local placeholder IDs
(`local_${Date.now()}`) with real server IDs. **✅ backend half fixed and shipped.**
**📋 the frontend half is not fixed** — actually rewiring `AppContext`'s local state to
consume that reconciliation data, including for actions queued *against* a not-yet-synced
local ID, is a genuine architectural change (ordering/dependency tracking across the
queue) that risks introducing new bugs if rushed. Documented as the top backlog item in
`FEATURE_STATUS.md` rather than attempted shallowly.

## S. Analytics

`buildTrendData` fabricates a flat trend line at the seeded score when a patient has zero
real sessions — visually indistinguishable from genuine stable performance, which could
mislead a caregiver into thinking there's real history. **📋 documented, not fixed** —
the correct fix (showing "not enough data yet" instead of a fake flat line) touches the
shared trend-chart contract used by three screens; flagged, not touched, given the size of
everything else already in this pass.

## T. Notifications

No push/in-app notification system exists in this app at all (only in-page alert
banners). Not a bug — it was never built. **📋 out of scope**, not attempted.

## U. Performance

Nothing alarming found for this app's scale. One N+1 query (`GET /api/patients` fetches
each patient's caregiver name in a per-row loop) — **📋 documented, not fixed**, harmless
at 3-patient demo scale.

## V. Security

The two most serious findings in this whole audit, both fixed:
1. **IDOR**: `applyDailyActivityStatus`/`applyAlertResolve` ran their `UPDATE` scoped to
   `patient_id`, but the follow-up `SELECT` that builds the API response was **not**
   re-scoped — a caller who owned patient B could pass patient A's `activityId`/`alertId`
   and receive patient A's data back (the write was a harmless no-op; the read leaked).
   **✅ fixed**, with a regression test that reproduces the exact cross-patient scenario.
2. The insecure hardcoded JWT-secret fallback (see Authentication above). **✅ fixed.**

Also see Authorization (G) for the `requireRole` gap, which is real but deliberately
**📋 not** fixed this pass for the reasons given there.

## W. Testing

Server: 13 tests → **22 tests** after this pass (9 new: IDOR regression ×2, sync
idempotency, invalid-domain/gameType rejection, non-numeric `?days=` rejection,
malformed-JSON-body rejection, duplicate-registration-race, email-case-insensitivity).
Frontend: 17 unit tests (voice layer, from the prior session) — unchanged, still passing.
No new frontend unit tests were added this pass because the bugs fixed here were UI/state
bugs best caught by the live browser QA actually performed (see `QA_REPORT.md`), not unit
tests of pure functions.

## X. Deployment

Unchanged from the prior session's work (Render + Vercel configs, auto-seeding, free-tier
compatibility) — this pass didn't touch deployment; see the repo's `README.md`.

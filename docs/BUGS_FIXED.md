# Bugs Fixed — 2026-08-25 audit pass

Grouped by area. Each entry: what was wrong → what changed → file(s). Full reasoning and
what was deliberately *not* fixed lives in `FULL_SYSTEM_AUDIT.md`.

## Security

- **Cross-patient data leak (IDOR)**: resolving an alert or updating a daily activity
  status looked up the result row by id alone, without re-checking `patient_id`, after an
  already-correctly-scoped `UPDATE`. A caller who owned a *different* patient could pass
  another patient's id and get their data back in the response.
  `server/src/mutations.ts` (`applyDailyActivityStatus`, `applyAlertResolve`) +
  `server/src/routes/alerts.ts`, `server/src/routes/dailyActivities.ts` (now return a
  clean 404 instead). Regression tests added in `server/src/index.test.ts`.
- **Insecure JWT secret**: silently fell back to a hardcoded, source-visible string with
  no warning. `server/src/index.ts` now warns loudly on boot if `SAHAAYA_JWT_SECRET` isn't
  set (the Render deploy config already auto-generates a real one).
- **Email case-sensitivity**: `Maya@X.com` and `maya@x.com` could register as two
  accounts; login was case-sensitive against whatever casing was stored.
  `server/src/routes/auth.ts` now trims + lowercases on both register and login.
- **Registration race**: two concurrent registrations for the same email could both pass
  the pre-check and hit a raw 500 on the `UNIQUE` constraint. `server/src/routes/auth.ts`
  now catches the constraint violation and returns a clean 409.

## Data integrity

- **No input validation on session creation**: `gameType`/`difficulty`/`domain` were only
  checked for truthiness, not validity — a bad value corrupted `cognitive_sessions` and
  silently no-op'd the profile-score update. `server/src/mutations.ts` (`applySession`)
  now validates against the real enums.
- **Offline sync had no idempotency**: a resent/replayed batch (e.g. a reconnect race)
  would re-run every mutation, creating duplicate records. `server/src/db.ts` (new
  `client_id`/`result_json` columns on `sync_log`) + `server/src/routes/sync.ts` now keys
  on the client's own queue-item id and returns the cached result on a repeat. New test:
  "is idempotent — replaying the same client item id does not apply the mutation twice".
- **Sync results didn't return the created resource**: the client had no way to reconcile
  local placeholder IDs (`local_...`) with real server IDs. `server/src/routes/sync.ts`
  now returns `data` per item (frontend consumption of this is a documented follow-up, see
  `FEATURE_STATUS.md`).

## Robustness (uncaught errors → raw 500s)

- `GET /api/sessions/:id?days=abc` threw `RangeError: Invalid time value` uncaught.
  `server/src/routes/sessions.ts` now validates `days` and returns 400.
- `POST /api/sync` with a non-array `items` threw synchronously in the `for...of` loop.
  `server/src/routes/sync.ts` now validates the shape and returns 400.
- A malformed JSON request body (any endpoint) fell through the global error handler as a
  generic 500 instead of the 400 it actually is. `server/src/index.ts`'s error handler now
  respects `err.status`/`err.statusCode`.

## Elderly experience — broken flows

- **No way to log out or switch role, anywhere.** New "Account" section in
  `src/pages/Elderly/VoiceSettings/ElderlyVoiceSettings.tsx`: shows the current patient +
  language, a visible "Switch Role" button that expands into the three demo accounts
  (direct re-login, not client-side impersonation), and a "Log Out" button. Reachable from
  the gear icon already present on Home/Activities/Voice.
- **Activity progress reset every time the user left and returned to Activities**, even
  though the sessions were already saved server-side — `gameResults` was local-only state.
  `src/pages/Elderly/Activities/ElderlyActivities.tsx` now seeds it from today's real
  `sessions` on mount.
- **Replaying a finished game duplicated its result**, corrupting the average-accuracy
  math and showing the game twice on the summary screen (`setGameResults` always
  appended). Same file: now replaces the existing entry for that `gameType`.
- **"Back to Activities" → primary button re-launched the just-finished game** instead of
  advancing, because the button trusted `currentGameIdx` (which only tracks "whichever
  game is on screen") instead of which games actually have a saved result. Same file: a
  derived `nextIncompleteIdx` is now the single source of truth for "what's next",
  consistently used by the select-screen list, the primary CTA, and `handleNextGame`.
- **A pending `setTimeout` could fire `onComplete` after the user had already navigated
  away** (tapping "Back" during the "Checking your answers…" window), silently forcing
  them onto a result screen they didn't ask for. Fixed in `MemoryMatchGame.tsx`,
  `AttentionGame.tsx`, `RoutineRecallGame.tsx` (timeout id now cleared on unmount).
- **Reminders: tapping "Later" gave zero visible feedback** — it set status to
  `'delayed'`, but the card only branched on `'skipped'`, so the same Done/Later buttons
  just stayed put and the reminder silently vanished from both header counts.
  `src/pages/Elderly/Reminders/ElderlyReminders.tsx` now shows a clear "⏰ Delayed" note
  and includes delayed reminders in the "upcoming" count.
- **Voice ASR mic could get permanently stuck** on "Listening…" if the browser fired
  `onend` without a prior result (happens on silence in some browsers) — the promise
  never settled. `src/services/voiceService.ts`'s `listenOnce` now rejects on a bare
  `onend`.
- **`AttentionGame`'s grid column count was dead code**: `difficulty === 'easy' ? 3 : 3`
  always evaluated to 3. Simplified to a plain constant.
- **`MemoryMatchGame`'s wrong-answer distractors were a fixed slice**, not shuffled — the
  same wrong options appeared every replay of a given set. Now shuffled.
- **Fixed the React console warning** ("mixing shorthand and non-shorthand padding") on
  the Activities result/recommendation screens — `paddingBottom` + `padding` on the same
  style object, `ElderlyActivities.tsx`.

## Caregiver / Healthcare experience

- **Hardcoded "Maya Devi"** in page copy on 4 screens regardless of which patient was
  actually assigned — `CaregiverReminders.tsx`, `CaregiverMemory.tsx` (×2 in the latter),
  `CaregiverAlerts.tsx` (×2). Now reads `currentPatient?.name`.
- **Fabricated schedule text**: "Scheduled 10:00 AM" shown whenever no session existed yet
  today, presented as if it were real data. `CaregiverDashboard.tsx` now says "No activity
  yet today".
- **Caregiver dashboard showed "Loading…" forever** if the caregiver genuinely has zero
  assigned patients (indistinguishable from a stuck spinner). Now shows "No patient
  assigned yet" once loading has actually finished.
- **Alert banner was a `<div onClick>`** — unreachable and inoperable by keyboard/screen
  reader despite being a primary navigation action. Converted to a real `<button>`.
- **HCWPatients: fake "Active Patients" metric** — hardcoded to equal Total Patients,
  measuring nothing. Now computed from real session activity in the last 7 days
  ("Active This Week"), one extra `?days=7` fetch per patient.
- **HCWPatients: `<tr onClick>` patient rows** were unreachable by keyboard. Added
  `tabIndex`, `role="link"`, `aria-label`, and an `onKeyDown` handler for Enter/Space.
  Verified live: focusing a row and pressing Enter now navigates correctly.
- **HCWPatients / HCWReports: no error handling** around the initial data fetch — a failed
  request left the screen stuck on "Loading…" forever with no way to recover. Both now
  have a real error state with a "Try Again" action.
- **HCWReports "Export Report" only called `window.print()`** despite `html2canvas` and
  `jspdf` being installed and unused, with a misleading "Download" icon. Now generates a
  real PDF from the report content (falls back to `window.print()` only if PDF generation
  itself throws).
- **Missing empty states**: HCWPatients (zero assigned patients), HCWReports (zero
  patients — nothing to report on), CaregiverActivity's session history table,
  CaregiverReminders' list, CaregiverMemory's grid, elderly My Day timeline, elderly
  Reminders list. All now show a real message instead of a silently blank area.
- **Reminder/Memory "Add" forms**: empty-title submission silently did nothing (no error
  shown); Save had no loading state or duplicate-submit guard; a genuine backend error was
  an unhandled promise rejection with the optimistic UI still showing success.
  `CaregiverReminders.tsx` and `CaregiverMemory.tsx` now show inline validation errors,
  disable Save while in flight, and surface a save-failed message.
- **Sidebar "Switch Role" button actually performed a full logout** — label didn't match
  behavior. `src/components/Sidebar/Sidebar.tsx` now has a real switch-role flow
  (re-login as another demo account, matching the elderly flow) plus a correctly-labeled
  "Log Out" button.

## Consistency / visual

- **Duplicate, diverging CSS definitions** for `.badge`/`.badge--*`, `.data-table`,
  `.reminder-chip*`, `.activity-card*`, `.btn--ghost`, `.btn--success`, `.form-textarea` —
  each defined twice in `src/index.css` with different values; the later, unintentional
  one was silently winning the cascade (e.g. the intended 2-column elderly reminder-chip
  grid was dead code, overridden by a flex-column redefinition further down). Deduplicated
  to one correct definition each.
- **Horizontal page overflow on mobile widths**: two screens used a fixed
  `repeat(4, 1fr)` KPI/stat grid that didn't fit 414px viewports
  (`CaregiverReminders.tsx`, `HCWPatients.tsx`). New reusable `.stat-grid` class
  (`repeat(auto-fit, minmax(110px, 1fr))`) reflows instead of overflowing. Also added a
  `.data-table-scroll` wrapper so wide tables scroll horizontally within their own
  container rather than the whole page.
- **Undersized touch targets**: welcome-card close button (28px→40px), per-item voice
  speaker buttons (32px→40px).
- **Non-descriptive aria-label**: `SpeakableLabel` announced just the raw word being
  spoken; now describes the action ("Hear \"X\" spoken aloud").
- **Color-only correct/incorrect indication** in `MemoryMatchGame` and `AttentionGame`
  review grids (every other game already used a ✓/✗ glyph). Added the same glyph overlay.
- **Routine Recall's ↑/↓ reorder buttons**: no `aria-label`, no `disabled` attribute at the
  boundary rows, ~30px tap target. Added both, bumped to 40×36.
- **"Simulate Offline"** (a developer-facing label) shown directly on the elderly Home
  screen. Reworded to "Go Offline", matching the existing indicator's own wording.

## State-management robustness

- **`OfflineContext`'s sync-drain ran a network call and side effects inside a `setState`
  updater function** — impure, and StrictMode may invoke updaters twice, risking two
  concurrent `/sync` POSTs for the same batch. Rewritten to read from a ref instead.
- **The final-screen recommendation discarded the server's authoritative response** and
  independently recomputed one from `cognitiveProfile` state that could still be one
  update behind. `ElderlyActivities.tsx` now stores and prefers the real server response.

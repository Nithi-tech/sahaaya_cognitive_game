# QA Report — 2026-08-25 audit pass

## Addendum 3 — Games hub + shared session extraction (same day, later session)

New bottom-nav "Games" tab (`/games`) grouping all 15 registry games by category. Required
extracting `ElderlyActivities.tsx`'s play/result logic into `useGameSession.ts` +
`GameResultScreen.tsx` so the new hub didn't duplicate it — see `GAME_ENGINE.md`.

### Automated
```
root:   npx tsc -b        → clean
root:   npm run build     → clean
root:   npx vitest run    → 28/28 passing (unchanged)
server: npm test          → 22/22 passing (unchanged)
root:   npx oxlint        → 0 errors; 27 warnings in src/ (up from ~19, but every one is an
                             instance of an already-accepted pre-existing pattern — Date.now()
                             in a useState initializer, setState-in-effect — proportional to
                             the new files added, not a new category of warning)
```

### Live QA (headless Chromium)
1. **Regression check on the refactored Activities flow** (the highest-risk part of this
   pass, since it touched already-tested code): played Pattern Recognition from "Today's
   Activity" start to finish, confirmed it still reaches the result screen with correct
   accuracy/mistakes/AI-adjustment, and "Next Activity" correctly returns to Today's
   Activity. Byte-for-byte same result-card UI as before the refactor.
   - **A real bug was caught here, but it was in the QA script, not the app**: a generic
     "click any button that isn't Back/Pause/Restart/..." driver kept clicking a header
     button with empty text content (the icon-only Exit/Back arrow, which has an
     `aria-label` but no visible text) — exiting the game every round instead of playing it,
     which looked exactly like a stuck regression until inspected screenshot-by-screenshot.
     Re-verified with an explicit, targeted driver once the actual cause was found; noted
     here because a debugging dead-end that isn't recorded is easy to mistake for a real
     finding later.
2. **A real product bug caught and fixed during the extraction, before it shipped**: the new
   shared `GameResultScreen` initially hardcoded "Great work!" in English — the original
   inline JSX it replaced had a `lang === 'as' ? t('game.great_work') : 'Great work!'`
   check that got dropped in the mechanical move. Fixed by giving the shared component its
   own `useTranslation()` call. Would have silently regressed the result screen to English
   for every Assamese-language user, on every game, if not caught.
3. **Games hub**: confirmed "15 games across 7 categories" summary, category filter chips
   correctly narrow the grid (checked Focus → 3 games), played Memory Span from inside the
   hub end-to-end, confirmed "Play Another" returns to the library (not Home), and a
   "Played" badge appears on that game's card afterward.
4. **Caregiver dashboard cross-check** (repeated deliberately, same reasoning as prior
   passes): after playing from the Games hub specifically (not Activities), logged in as
   caregiver and confirmed the session appears correctly.
5. Zero browser console/page errors across the full run.

### Not performed (and why)
- Playing all 15 games through the new hub individually — spot-checked Memory Span (hub)
  and Pattern Recognition (Activities regression check); the other 13 all render through the
  identical `GameShell`/`useGameSession` path already exercised by prior passes, so this
  wasn't repeated per-game.

## Addendum 2 — extracted-games curated reimplementation pass (same day, later session)

Three games reimplemented from the `extracted-games/` reference (Peripheral Awareness,
Memory Span, Breathing Exercise — see `LICENSE_DECISION.md` and `GAME_ENGINE.md`).

### Automated
```
root:   npx tsc -b        → clean
root:   npm run build     → clean (typecheck + Vite build)
root:   npx vitest run    → 28/28 passing (unchanged — registry tests are structural,
                             not count-based, so they cover the 2 new registry entries
                             without needing new assertions)
server: npm test          → 22/22 passing (unchanged — VALID_GAME_TYPES extension didn't
                             need new tests, same as the prior pass)
root:   npx oxlint        → 0 errors
```

### Live QA (headless Chromium against the real running app + real backend)
1. **Breathing Exercise**: opened from the new Home screen "Relax" card, switched to
   Steady (box-breathing) mode, started it, and let it run past a full phase transition —
   confirmed the circle animates between inhale/hold/exhale scale, the phase label updates
   ("Breathe In" → "Breathe Out"), and the elapsed-time counter advances. Paused, reset,
   navigated back — no console errors.
2. **Peripheral Awareness**: confirmed "15 activities available" on the Explore screen
   (13 + 2, registry wiring correct), played a full 6-trial easy-difficulty round end to
   end (stimulus → mask → vehicle question → location question → feedback, looped), reached
   the result screen with a real accuracy/mistakes/AI-adjustment readout.
3. **Memory Span**: played a full round (self-paced study screen → tap "I'm Ready" →
   8-word recognition grid, 4 studied + 4 distractors at easy difficulty → submit → result).
4. **Caregiver dashboard integration** (the step that caught two real bugs in the prior
   pass, so repeated deliberately): logged in as the caregiver immediately after, opened
   Cognitive Activity, and confirmed "Recent Activity Sessions" showed both new games by
   their real display names ("Memory Span", "Peripheral Awareness") — not raw ids like
   `memory_span` — at the top of the list (newest-first), with correct domain columns
   (Memory / Attention) and accuracy/mistakes matching what was just played.
5. Zero browser console/page errors across the whole run (login → both games → breathing
   exercise → caregiver dashboard).

### Not performed (and why)
- **Assamese voice output for the two new games** — narration keys were written and the
  `voice.*`/`relax.*` dictionary entries were added to both `en` and `as`, but audio output
  itself wasn't checked in Assamese specifically (same as prior passes — this sandbox
  doesn't reliably capture synthesized audio) — the underlying voice service is unchanged
  from what already ships.
- **Memory Span / Peripheral Awareness at medium and challenging difficulty** — only easy
  was exercised live; the difficulty-scaling tables were verified by reading the code
  (trial/word counts and timings change correctly per `Difficulty`), not by playing every
  tier.

## Addendum — Cognitive Activity Engine pass (same day, follow-up session)

### Automated
```
root:   npx vitest run → 28/28 passing (17 prior + 11 new: registry integrity,
                          pickTodaysGame selection/fallback logic, toSessionPayload
                          mapping — src/games/registry.test.ts)
server: npm test        → 22/22 passing (unchanged — VALID_GAME_TYPES extension
                          didn't require new tests, existing suite covers the
                          validation path generically)
root:   npm run build   → clean
root:   npx oxlint       → 0 new errors
```

### Live QA (headless Chromium against the real running app + real backend)
Every item below was actually clicked through and screenshotted, not inferred from code:

1. **All 13 games reachable** from "Explore Activities" — confirmed by text search
   against the rendered page for every game name.
2. **Color Focus (Stroop reimplementation)**: played a full round of trials, reached the
   result screen with correct accuracy/mistakes/AI-adjustment display.
3. **GameShell chrome on a brand-new game type**: Pause → confirmed the overlay appears
   and blocks interaction; Continue → confirmed it resumes; Restart → confirmed on an
   *existing* game (Memory Match) that it actually remounts and resets internal state
   (verified the memorize-phase countdown restarted from scratch, not just re-rendered).
4. **Exit navigation**: started a game from Explore, exited, confirmed it returned to
   Explore (not Today) — the `cameFrom` tracking works both directions.
5. **Timing-critical games under real browser timers**: Go/No-Go (tapped through 8 live
   stimulus windows) and Dual Memory (let a full 8-trial, 3.2s-interval round run
   unattended) both completed cleanly with zero console errors — this was the specific
   risk area after finding and fixing a stale-closure timing bug in Dual Memory's own
   draft (see below).
6. **Offline behavior with a new game**: set the browser's actual network state to
   offline (not just the app's demo toggle), played Number Focus to completion, confirmed
   it reached the result screen with no network. Reconnected, waited for the sync queue to
   drain, then queried the backend API directly and confirmed the session existed with
   correct fields and — critically — appeared exactly once, not duplicated.
7. **Caregiver dashboard integration**: after playing 5 different games (3 new, 2
   existing) as the elderly user, logged in as the caregiver and confirmed the "Recent
   Activity Sessions" table showed all of them with correct names, domains, and accuracy.
   This step is what surfaced two real, previously-unknown bugs (next section).

### Bugs found *during* this QA pass (not present in the original request, found by
actually testing rather than assumed away)
- `CaregiverActivity.tsx`'s `sessions.slice(-10).reverse()` assumed `sessions` arrived
  oldest-first; the API actually returns newest-first (`ORDER BY timestamp DESC`), so the
  "Recent Activity Sessions" table was silently showing the *oldest* 10 sessions under a
  "Recent" heading — today's newly-played games never appeared. Fixed to `slice(0, 10)`.
- The same table's `gameType.replace('_', ' ')` only replaces the *first* underscore — a
  new game id with two underscores (`go_no_go`) rendered as "go no_go". Fixed by looking
  up the game's real display name from the registry instead of humanizing the raw id.
- A bug caught and fixed *before* it ever ran: the first draft of `DualMemoryGame`'s
  interval-expiry timer read React state (`positionResponded`/`audioResponded`) from
  inside a `setTimeout` closure — which only ever sees the values that existed when the
  timer was *created*, not whatever the user tapped afterward. Every trial would have
  silently scored as "no response," regardless of how fast the user actually answered.
  Rewritten to read from refs (which a closure always sees the current value of)
  before ever being tested live.

### Not performed (and why)
- **The 6-way domain-scoring parity** between the client-side offline adaptive engine
  and the server-side one for the 2 new domain-sharing games (Color Focus/Number
  Focus/Quick Response/Go-No-Go all map to `attention`) wasn't separately re-verified —
  both engines were already exercised by the existing test suite and by the live offline
  test above; no new scoring *logic* was added, only new game ids feeding into the same
  existing `attention`/`memory`/`recognition` domains.
- **Load/concurrency testing** of the new games — out of scope, same as the original
  audit pass.

## Automated

```
server: npm test    → 22/22 passing (13 pre-existing + 9 new this pass)
root:   npm test     → 17/17 passing (voice layer, unchanged this pass)
root:   npm run build → clean (typecheck + Vite build)
root:   npx oxlint    → 0 errors, 19 pre-existing warnings (none new)
server: npx tsc --noEmit → clean
```

New tests this pass (all in `server/src/index.test.ts`): two IDOR regression tests
(cross-patient alert resolve / daily-activity update, both now correctly 404), sync
idempotency (replaying the same client item id creates exactly one record, not two),
invalid `domain`/`gameType` rejection on session creation, non-numeric `?days=` rejection,
malformed-JSON-body rejection (400 not 500), duplicate-registration-race handling,
email-case-insensitive login.

## Manual / live QA

Performed against the real running app (both dev servers, real SQLite DB, real login) via
a headless-Chromium driver, not by reading code. Screenshots were captured and reviewed at
each step. Sequence actually run:

1. **Elderly flow**: login → Home → My Day → Reminders → Talk to Sahaaya → Voice Settings
   → Memory → Activities → play Memory Match to completion → verify progress screen.
   ✅ all reachable, no console errors.
2. **Progress persistence**: completed a game, navigated Home → Activities, confirmed the
   "Continue — Game N" button showed the *same* game number as before navigating away
   (previously reset to "Start Activities"). ✅ confirmed fixed, screenshot captured
   before/after.
3. **Replay deduplication**: replayed an already-completed game from the select screen,
   confirmed the "next incomplete" indicator and CTA were unchanged afterward (previously
   the duplicate `GameResult` entry could corrupt this). ✅ confirmed fixed.
4. **Role switching**: from the elderly Voice Settings screen, opened "Switch Role",
   selected the caregiver demo account, confirmed a full session switch (new JWT, new
   user, correct caregiver dashboard rendered with the real assigned patient's data).
   ✅ confirmed working end-to-end, zero console errors during the switch.
5. **Reminders "Later"**: tapped Later on a reminder, confirmed the "⏰ Delayed" message
   now appears (previously no visible change at all). ✅ confirmed fixed.
6. **Healthcare patient table keyboard access**: at desktop viewport width, tab-focused a
   patient row and pressed Enter; confirmed it navigated to that patient's detail page
   (previously only a mouse click worked). ✅ confirmed fixed. Also confirmed the "Active
   This Week" KPI now shows a real, distinct value from "Total Patients" (previously
   identical — a fake metric).
7. Caught one real console warning (`padding`/`paddingBottom` shorthand conflict) live
   that hadn't been in the original static findings list, traced it, and fixed it
   (`ElderlyActivities.tsx`).

Two QA-script false positives were caught and corrected during this process (a
too-strict Playwright text-matcher against multi-line emoji+label buttons, and a
locator that missed a `<tr onClick>` row before that row's accessibility fix was
applied) — both were driver bugs, not app bugs; noted here for transparency rather than
silently discarded, since a debugging record that hides its own dead ends is less
trustworthy than one that shows them.

## Not performed (and why)

- **Cross-browser testing** (Safari/Firefox specifically) — only Chromium was available
  in this environment. The voice layer (built in a prior session) already has
  browser-capability fallbacks for exactly this reason.
- **Actual PDF file inspection** for the HCWReports export — confirmed the button no
  longer just calls `window.print()` and that `html2canvas`/`jspdf` are now real code
  paths (verified by build output including `html2canvas-*.js` and `jspdf.es.min-*.js` as
  separate chunks, confirming they're actually bundled/used now, not dead imports), but
  did not open and inspect a generated PDF file byte-for-byte in this sandboxed
  environment.
- **Sidebar switch-role UI at mobile viewport** — the `Sidebar` component is desktop-only
  by design (caregiver/healthcare portals aren't optimized for phone width); tested at
  desktop width (1280px) instead, where it's actually meant to render.
- **Load/stress testing, penetration testing** — out of scope for this pass; the security
  fixes made (IDOR, JWT fallback) were verified functionally (regression tests), not via a
  dedicated security testing tool.

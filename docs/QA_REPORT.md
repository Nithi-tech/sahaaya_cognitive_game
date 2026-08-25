# QA Report — 2026-08-25 audit pass

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

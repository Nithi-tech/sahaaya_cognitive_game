# Feature Status

What exists and actually works, vs. what was proposed (in the mega-scope brief this audit
was run against) and deliberately not built this pass, with the reasoning for each.
"Quality over quantity" was the brief's own stated priority — this file is the record of
applying it: fixing and hardening what exists took priority over adding new surface area.

## Implemented and working (verified live, not just read)

- 6 cognitive games (Memory Match, Object Recognition, Attention, Pattern, Routine Recall,
  Family & Faces), each with voice narration, adaptive difficulty, and — as of this pass —
  correct progress persistence and replay handling.
- Elderly / Caregiver / Healthcare role-scoped experiences on one shared backend.
- **Role switching** for the elderly user (this pass's one explicitly-required feature):
  a visible "Switch Role" section in Voice Settings, direct re-login as another demo
  account (not client-side impersonation — a real, separate authenticated session).
  Caregiver/Healthcare sidebars got the same capability for consistency.
- Reminders, memories (add/browse), daily activity timeline, alerts, cognitive-profile
  trends and charts, PDF report export.
- Offline-first: optimistic local updates, a persisted sync queue, idempotent replay on
  reconnect.
- Multilingual (English/Assamese) UI, voice, and content via the existing i18n layer.
- Auth: register/login/JWT sessions, patient-ownership-scoped authorization.

## Fixed this pass

See `BUGS_FIXED.md` for the full itemized list — roughly 45 concrete bugs across security,
data integrity, broken flows, accessibility, and visual consistency.

## Not implemented — and why

### New cognitive games (Sequence Builder, Sound Recognition, Picture Story Recall, Find
the Change, Word Association, Category Sorting, Festival Memory, Music Memory, etc.)

**Not built.** The existing 6 games had real, user-facing bugs (lost progress, duplicate
results, stuck timers, a dead mic) that directly hurt the people using them today. Fixing
those took priority over adding an 7th–15th game on top of a shakier foundation. Building
even one of these properly (content authoring, voice narration text, cultural-content
sourcing, difficulty tuning, testing) is comparable in scope to everything in
`BUGS_FIXED.md` combined — attempting several in the time available would have meant
shallow, likely-buggy stubs, which is worse than not shipping them.
**Recommended next step**: pick exactly one (Sequence Builder is the closest fit to the
existing `RoutineRecallGame` pattern — could reuse most of its reordering UI) and build it
to the same bar as the other 6, including tests.

### Game generation engine (structured `GameDefinition` content model)

**Not built.** This is a real, valuable refactor — the 6 games currently duplicate logic
independently (which is *why* the setTimeout-leak bug and the styling drift existed in
multiple copies). But it's a foundational rewrite touching all 6 games at once, which is
high-risk to do quickly and low-value to do halfway. Deferred as a deliberate,
whole-refactor project rather than attempted as a partial one.

### Cultural content library / NER content packs (Assam + 7 other states)

**Not built.** Genuinely a content and localization project (sourcing culturally accurate
objects/images/audio per region), not an engineering task this pass could responsibly
attempt. The existing Assam-only content stays as-is.

### Memory Moments, Gentle Day, Daily Memory Recap, Caregiver Check-in, One-tap Family
Contact

**Not built.** Each is a genuinely new feature (new UI, in most cases new backend fields
or endpoints) rather than a fix to something existing. None were broken — they simply
don't exist yet. Given the volume of real bugs found in the existing surface area, adding
new unbuilt-and-untested features on top wasn't the responsible call for this pass.
**If prioritizing one**: Daily Memory Recap is the cheapest — it's mostly a read-only
summary of data (`dailyActivities`, `reminders`, `sessions`) that already exists.

### Offline sync: full client-side ID reconciliation

**Half-built.** The server now returns the created/updated resource per synced item and
sync is idempotent (see `BUGS_FIXED.md`). What's *not* done: actually wiring
`AppContext`'s local state to consume that reconciliation data, including for a second
action queued against a still-local (`local_...`) id before the first one has synced. That
ordering/dependency problem is a real architectural piece (either strict per-resource
sync ordering, or a smarter queue) — attempting it quickly risked introducing new bugs
into the offline path, which already works correctly for the common case (a single queued
action, not a chain of them). **This is the single highest-value backend follow-up.**

### Role-based (not just patient-ownership-based) authorization

**Not built**, and deliberately so — see `FULL_SYSTEM_AUDIT.md` section G. The exact
intended per-route permission matrix (which actions are elderly-allowed vs.
caregiver/healthcare-only) isn't documented anywhere in the product today, and every
route currently trusts patient-ownership only. Guessing the matrix wrong and applying
`requireRole` incorrectly risks silently breaking legitimate elderly self-service flows
(recording their own sessions, updating their own reminders, editing their own voice
settings) — a worse outcome than the current gap. **Recommended next step**: whoever owns
product decisions writes the explicit permission matrix (one row per route, one column per
role), then it's a mechanical `requireRole(...)` application per route.

### Full WCAG accessibility pass, analytics fake-data-vs-real-data distinction, timestamp
format unification, DB indexing

Each documented as a specific, real, non-urgent finding in `FULL_SYSTEM_AUDIT.md` — not
fixed this pass because none were causing user-facing breakage today, and each deserves
its own focused pass rather than a rushed partial fix bundled into this one.

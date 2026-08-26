# Feature Status

What exists and actually works, vs. what was proposed (in the mega-scope brief this audit
was run against) and deliberately not built this pass, with the reasoning for each.
"Quality over quantity" was the brief's own stated priority — this file is the record of
applying it: fixing and hardening what exists took priority over adding new surface area.

> **Update (Cognitive Activity Engine pass):** the "Not implemented" entry below for a
> structured `GameDefinition` registry and new cognitive games is now **superseded** — both
> were built in a follow-up pass. See `GAME_ENGINE.md` for the architecture and
> `LICENSE_DECISION.md` for why 5 of the 7 new games were independently reimplemented
> rather than adapted from the reference repository the request named. This file's
> original "not implemented" reasoning is left below unedited for the historical record;
> treat the note above as the current truth for those two items specifically.

## Implemented and working (verified live, not just read)

- **15 cognitive games** on a shared `GameDefinition` registry (`src/games/registry.ts`):
  the original 6 (Memory Match, Object Recognition, Attention, Pattern Recognition, Daily
  Routine Recall, Family & Faces) plus 7 from the first Cognitive Activity Engine pass —
  Color Focus, Quick Response, Number Focus, Block Memory, and Dual Memory (independent
  reimplementations of the Stroop test, reaction-time task, Schulte table,
  spatial-sequence/Simon task, and N-back respectively), Go/No-Go ("Gentle Focus"), and
  Find the Change — plus 2 more added when reconciling the `extracted-games/` request:
  Peripheral Awareness (a divided-attention paradigm) and Memory Span (verbal word-list
  recall). All 15 render inside one unified `GameShell`, all persist through the same
  `addSession` pipeline into activity history / adaptive engine / cognitive profile /
  caregiver dashboard / analytics / alerts, and all were verified working live — including
  one played entirely offline and confirmed synced to the backend with no duplication
  afterward. See `GAME_ENGINE.md`.
- **Breathing Exercise**: a standalone guided-breathing wellness screen (`/relax`, linked
  from the elderly Home screen) with three presets. Deliberately **not** part of the game
  registry or the scored pipeline above — see `GAME_ENGINE.md` for why.
- **Games hub** (`/games`, new bottom-nav tab beside Home): every registry game grouped by
  category with quick-filter chips and an attractive card grid — a second, equally-real
  entry point onto the same tested play/result pipeline "Today's Activity" uses (shared via
  `useGameSession`/`GameResultScreen`, not duplicated). "Explore Activities" now routes here
  instead of maintaining a second full-registry list. See `GAME_ENGINE.md`.
- **"Today's Activity" / "Explore Activities"**: the elderly Activities screen no longer
  shows a fixed list by default — it recommends one game (via the existing adaptive engine
  plus a new `pickTodaysGame()` selector) with a plain-language reason, and the full
  registry is one tap away for a user who'd rather choose themselves.
- Voice narration, adaptive difficulty, and — as of the prior audit pass — correct
  progress persistence and replay handling, all now apply uniformly across all 13 games
  via the shared shell rather than being reimplemented per game.
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

### ~~New cognitive games~~ — SUPERSEDED, see the update note at the top of this file

Originally deferred here; 7 new games (Color Focus, Quick Response, Number Focus, Block
Memory, Dual Memory, Go/No-Go, Find the Change) were built in a follow-up pass. Still
genuinely **not built**, and deliberately so, for the same "quality over quantity"
reasoning as before: Sequence Builder (too close to the existing Daily Routine Recall
without a distinct content angle — needs one before it's worth building separately), Sound
Recognition, Picture Story Recall, Word Association, Category Sorting, Festival Memory,
Music Memory. Each would need real content/audio authoring, not just a UI wrapper.

### ~~Game generation engine~~ — SUPERSEDED, see the update note at the top of this file

Originally deferred here as "high-risk to do quickly." Built in a follow-up pass as
`src/games/registry.ts` + `GameDefinition`/`CognitiveGameResult` (`src/games/types.ts`) —
see `GAME_ENGINE.md` for the full architecture. What's still true: the original 6 games'
*internal* logic was deliberately left untouched (only wrapped by the registry/shell) —
a deeper refactor to make them share code with each other (not just a common shell) is
still a separate, not-yet-attempted project.

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

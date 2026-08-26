# Cognitive Activity Engine

How Sahaaya's games are structured, added, and how a result gets from "user tapped an
answer" to "caregiver sees an updated trend chart." For the legal analysis behind the
reimplemented games (12 of the 15 in the registry), see `LICENSE_DECISION.md`.

## The registry (`src/games/`)

Every game — the original 6, the 7 added in the first Cognitive Activity Engine pass, and
2 more added when reconciling the `extracted-games/` request (see `LICENSE_DECISION.md`) —
is one entry in `src/games/registry.ts`, implementing the shared `GameDefinition` contract
(`src/games/types.ts`):

```ts
interface GameDefinition {
  id: GameType;
  name: string;
  category: GameCategory;          // MEMORY | FOCUS | REACTION | PATTERN | ROUTINE | GENTLE | ADVANCED
  cognitiveDomains: CognitiveDomain[];
  difficultyLevels: Difficulty[];
  estimatedDuration: number;       // minutes
  elderlyFriendly: boolean;
  voiceSupported: boolean;
  offlineSupported: boolean;
  culturalContentSupported: boolean;
  component: ComponentType<GameComponentProps>;
}
```

Nothing else in the app hardcodes a list of games anymore. `ElderlyActivities.tsx` (the
"Today's Activity" / "Explore Activities" screens), the adaptive engine's
`getDomainFromGame()`, and the caregiver activity table's session-name display all read
from this one registry. Adding another game means adding one entry here — no other file
needs to know it exists.

Every game component still receives exactly the same props the original 6 always did:
`{ difficulty, onComplete, memories }`. That's deliberate — it's why none of the original 6
game files needed to change to join this system.

## Why results still flow through the *old* pipeline

`CognitiveGameResult` (`src/games/types.ts`) is the rich shape the engine assembles around
every `onComplete` call — it adds bookkeeping the original 6 games never tracked
individually (`replayCount`, `startedAt`/`completedAt`, `assistanceUsed`). But it is
**not** a new backend data model. `src/games/resultMapping.ts`'s `toSessionPayload()`
reduces it straight back down to the exact shape `addSession()` already expected:

```
CognitiveGameResult → toSessionPayload() → addSession() → same backend route,
same adaptive-engine scoring, same cognitive_profiles table, same caregiver
dashboard, same analytics, same alerts — as every session before this work.
```

This was a deliberate architecture choice over standing up a parallel results system: the
existing pipeline was already correct, tested, and handles offline sync, idempotency, and
authorization — reinventing it for the new games would have meant re-solving problems
that were already solved, with no benefit. Verified live end-to-end, including with a
brand-new game played entirely offline and confirmed synced to the backend afterward with
no duplication (see `QA_REPORT.md` for the exact steps — this document only claims what
was actually checked).

**Backend change required**: `server/src/mutations.ts`'s `VALID_GAME_TYPES` allowlist had
to be extended by hand to accept the 7 new game ids (it's a security control — added in an
earlier pass specifically to stop garbage `gameType` values from corrupting the
`cognitive_sessions` table — so it can't just accept anything). This is the one place a
new game's id has to be added *outside* the frontend registry; noted here so it isn't
missed for game #14.

## The unified game shell (`src/components/GameShell/GameShell.tsx`)

Every activity — old and new — now renders inside the same shell, which owns exactly the
chrome the product spec calls for: Back/Exit, an open-ended progress label ("Activity 3
today" — deliberately not "3 of 6," since Today's Activity is no longer a fixed
curriculum), the game's title, a Difficulty badge, Pause, and Restart.

What the shell deliberately does **not** own: each game's own instruction text and voice
narration. Every game already wraps its own instruction in `<QuestionNarrator>` (built in
an earlier session) — duplicating that at the shell level would mean the app talking over
itself. The shell's "Pause" is a distinct, coarser control layered on top: it silences any
in-progress narration *and* shows a full "step away for a moment" overlay, which is a
different use case than the per-question Hear-Again/Pause/Stop controls already inside
each game.

**Restart** works by remounting the active game component with a changed `key` prop
(`` `${gameId}-${restartKey}` ``) — every game already resets its own state from scratch on
mount (that's just how they're written), so this needed no changes inside any game file.

**Known limitation, stated plainly**: Pause is a UI overlay, not a true engine-level pause.
For the three time-critical games (Quick Response, Dual Memory, Go/No-Go), an in-flight
trial's internal timer keeps running behind the overlay rather than freezing. In practice
this is a minor, non-breaking edge case — worst case, one trial silently completes while
paused — but it's not pretended away here.

## "Today's Activity" / "Explore Activities"

`src/games/recommend.ts`'s `pickTodaysGame(domain, recentGameIds, availableGames)` sits on
top of the *existing* `generateRecommendation()` engine (`src/engines/adaptiveDifficulty.ts`,
unchanged) rather than duplicating its scoring logic. The existing engine already decides
*which domain* to recommend and *why* (its `reason` string is what's shown on the card,
e.g. "Attention activity performance is at 72%, which can benefit from practice."); the new
function's only job is turning "recommend the attention domain" into one specific,
elderly-friendly, not-just-played `GameDefinition` — preferring `elderlyFriendly: true`
games (Dual Memory, marked `false`, is never the automatic pick) and avoiding whatever was
played most recently.

Both `todaysRecommendation` and `todaysPick` are recomputed on every render via `useMemo`,
so returning to the Today screen after finishing one activity always reflects it — verified
live: the card correctly showed a different pick immediately after each completed game.

`family_faces` is filtered out of both the Explore list and the recommendation pool
whenever the patient has fewer than 2 family memories on file — the same rule the original
fixed-sequence flow already enforced, now applied once (`availableGames` in
`ElderlyActivities.tsx`) instead of duplicated per-screen.

## Categories

`MEMORY / FOCUS / REACTION / PATTERN / ROUTINE / GENTLE / ADVANCED` are UI-only groupings
(the `category` field) — they don't affect scoring, which still runs on the underlying
`cognitiveDomains`. `GENTLE` is used for exactly the case the product brief called out:
Go/No-Go is a real impulse-control paradigm, and it's labeled "Gentle Focus" everywhere a
user sees it — the string "ADHD" does not appear anywhere in the app. Verified with a unit
test (`registry.test.ts`) that specifically checks the Go/No-Go entry's name and category.

## The Games hub (`/games`, bottom-nav tab)

A second entry point onto the same registry, for a user who'd rather browse and pick than
take the AI's one recommended pick. `src/pages/Elderly/Games/ElderlyGames.tsx` groups every
`GAME_REGISTRY` entry by `category` (Memory / Focus / Reaction / Pattern / Routine / Gentle
Focus / Advanced), with quick-filter chips and a game-card grid per section.

Because this is a *second* consumer of the exact "launch a game → adapt difficulty → persist
via `addSession` → show a result" flow that `ElderlyActivities.tsx` already owned, that logic
was extracted into `src/hooks/useGameSession.ts` (state machine + completion handling) and
`src/components/GameShell/GameResultScreen.tsx` (the result card UI) rather than copy-pasted a
second time — both `ElderlyActivities.tsx`'s "Today's Activity" flow and this hub now call the
same hook. This was a mechanical extraction, not a rewrite (verified by replaying the exact
same play-through live afterward and confirming byte-identical result-screen output and
correct caregiver-dashboard propagation) — the goal was zero behavior change for the existing
flow while giving the new hub the exact same tested guarantees for free. One real bug was
caught and fixed *during* the extraction: the shared result screen initially hardcoded
"Great work!" in English, silently dropping the Assamese translation
(`game.great_work` → `বহুত ভাল!`) that the original inline JSX had. Fixed by giving
`GameResultScreen` its own `useTranslation()` call rather than hardcoding copy.

"Explore Activities" (on the Today's Activity screen) now navigates to `/games` instead of
maintaining its own second copy of the full-registry list — one canonical "browse everything"
UI instead of two that could silently drift apart.

## Breathing Exercise — deliberately outside this registry

`src/pages/Elderly/Relax/BreathingExercise.tsx`, reachable from a "Relax" card on the
elderly Home screen (`/relax`), is a guided breathing tool (three presets: Calm, Steady,
Deep Rest — see `LICENSE_DECISION.md` for where it came from) — **not** a `GameDefinition`.
A breathing exercise has no meaningful accuracy or mistakes; forcing it through
`CognitiveGameResult` and the adaptive engine would inject fake scores into a domain (most
naturally `attention`) that a caregiver actually relies on to see real performance trends.
So it owns its own route, its own (unscored) local cycle/time counters, and never calls
`addSession()`. If a future request wants it to contribute to analytics, that needs its own
explicit metric — not a borrowed accuracy field — not a default assumption.

## What's genuinely new vs. what's a UI relabel

Worth being explicit about, since "15 games" undersells how much is actually novel logic:

- **Genuinely new mechanics, built from scratch**: Color Focus (Stroop), Quick Response
  (reaction time), Number Focus (Schulte table), Block Memory (spatial sequence / Simon),
  Dual Memory (N-back, audio modality via the existing voice service instead of audio
  files), Go/No-Go, Find the Change, Peripheral Awareness (a divided-attention / "useful
  field of view" paradigm — flash a center item and one marked position among a ring of
  eight, then ask what and where), Memory Span (verbal word-list recall, distinct from
  Memory Match's pictorial recognition — see `LICENSE_DECISION.md` for the two elderly-
  first departures from its reference: self-paced study, tap-to-recognize instead of
  typed recall).
- **Existing games, unchanged internals, now registry-driven**: Memory Match, Object
  Recognition, Attention, Pattern Recognition, Daily Routine Recall, Family & Faces.
- **Real bugs found and fixed while wiring this up** (not part of the original ask, but
  surfaced by actually testing the caregiver dashboard against real new-game data — see
  `BUGS_FIXED.md`-style detail in `QA_REPORT.md`): the caregiver "Recent Activity Sessions"
  table was silently showing the *oldest* 10 sessions instead of the newest 10 (a
  `.slice(-10).reverse()` that assumed the wrong sort order from the API), and a
  multi-underscore game id like `go_no_go` would have displayed as "go no_go" from a
  non-global string replace.

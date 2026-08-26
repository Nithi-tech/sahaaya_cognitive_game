# UI/UX Audit

Conducted by actually running the app (both dev servers, real seeded backend data) and
visually inspecting every major route across all three roles, at both mobile (390×844,
the elderly/primary viewport) and desktop (1440×900, the caregiver/healthcare viewport)
widths, plus one deliberate cross-check (caregiver dashboard at mobile width). Screenshots
were captured with Playwright and reviewed image-by-image, not inferred from source alone.
Zero JS console/page errors were thrown across the entire sweep — every problem below is a
**design** finding, not a functional crash.

**Honesty check first, because it matters for how to read this document**: the app is not
starting from zero. The caregiver dashboard, the reminders screen, and the in-game play
screens are already reasonably close to the bar this redesign is aiming for — clear
hierarchy, real data, working interactions. The problems below are concentrated in a
smaller number of *specific, fixable* things — icon language, a few pieces of leftover
developer-facing copy, some redundant/dense layout, and one broken responsive breakpoint —
not "everything is bad." Overstating the damage would make the redesign easier to sell and
harder to trust.

## Cross-cutting findings (apply to most/all screens — listed once, not per-screen)

### X1 — Iconography is native OS emoji used as primary UI icons everywhere
**Problem**: Nearly every icon in the product — page headers, KPI cards, nav labels,
reminder categories, memory categories, suggested-voice-prompts — is a raw emoji (🧠 💊 💧
🚶 🏥 👥 ✅ ⚠️ 📊 🎮 etc.), rendered at whatever size/style the user's OS supplies.
**Why it's a problem**: Emoji render inconsistently across OS/browser (Windows vs. macOS vs.
Android glyphs differ), can't be recolored or weight-matched to a design system, and at
the volume used here read as a demo/prototype rather than a considered product — directly
contradicts the brief's own "do not use excessive emojis / toy-like UI" constraint. It's
also an accessibility problem: emoji have inconsistent screen-reader announcements across
platforms.
**Proposed solution**: Adopt one icon library (`lucide-react` is already a dependency and
is already used in some places, e.g. `ArrowLeft`, `ChevronRight`) as the *only* icon source
for chrome/navigation/category iconography. Reserve emoji/illustration for a small,
deliberate set of *content* moments where they're actually representing a real-world object
being remembered (e.g., Memory Match's banana/rice/fish tiles) — that usage is legitimate
and shouldn't be swept away with the rest.
**Priority**: **P0** — this is the single highest-leverage change for "feels premium, not
prototype," and it's mechanical enough to do broadly once a component (`<Icon>` wrapper /
category-icon map) exists.

### X2 — Two pieces of literal developer/architecture text are shown to end users
**Problem**: (a) The landing page's demo-login section reads *"🔒 Each button above signs
in as a real seeded account (**password: demo1234**)..."* — the literal password is printed
in production-facing copy. (b) The Talk-to-Sahaaya voice screen shows a card titled
**"🏗️ Architecture Note"** explaining that it "Uses your browser's built-in speech
recognition... Swappable for Whisper, Bhashini, or AI4Bharat for broader Assamese ASR
coverage" — this is implementation documentation, written for a future engineer, shown
directly to an elderly end user.
**Why it's a problem**: Both read as debugging scaffolding left behind rather than shipped
copy. The password-in-copy issue is also a mild security-hygiene smell (training users that
credentials appear in plain UI text is a bad habit even for a demo). Neither belongs in "a
polished product that could be shown to investors."
**Proposed solution**: Landing page — keep the transparency ("this is a live demo, not
fake data") but drop the literal password from visible copy; if reviewers need it, put it
in the repo README, not the UI. Voice screen — remove the architecture note entirely, or
replace it with a genuinely user-facing line if a disclosure is wanted (e.g., "Works best
in a quiet room" / a privacy note about not recording).
**Priority**: **P0** — quick, high-embarrassment-risk fix, unrelated to the broader design
system work so it can land immediately.

### X3 — Color is sometimes used to mean two different things on the same screen
**Problem**: On Reminders, pastel card backgrounds are green for *completed* items but also
green for the entire *Daily Activity* category regardless of completion state — so a
not-yet-done "Evening Walk" card looks identical (green) to a completed medicine card.
**Why it's a problem**: The brief explicitly calls for "do not communicate information using
color alone," and here color is actually doing double duty inconsistently, which is worse —
a caregiver or elderly user pattern-matching on "green = done" will misread an unstarted
activity as finished.
**Priority**: **P1** — real but narrow; fixed by making completion state its own consistent
visual signal (a checkmark badge, already present) independent of category color, and giving
categories a *quieter*, consistent neutral tint rather than saturated category colors.

### X4 — Raw scores/percentages surfaced to the elderly user, not just the caregiver
**Problem**: The elderly Home screen shows a bare **"69 Engagement"** badge in the header.
The elderly Activities "Today's Activity" screen shows **"Your accuracy was 50% in today's
activity"** as the stated reason for the next recommendation.
**Why it's a problem**: The brief is explicit — "Do not expose technical AI terminology to
the elderly user," and the product's own stated personality is "never judgmental." A bare
50% read by someone with reduced processing speed and no context for what "accuracy" means
here can land as "I failed," which is the opposite of the intended supportive tone. This
kind of metric belongs on the *caregiver* dashboard (where it already correctly appears
with proper framing, e.g., "Fair 54") — not restated flatly to the person being measured.
**Priority**: **P0** for the elderly-facing instances specifically (dignity/tone issue,
narrow and easy to fix); the caregiver-facing versions of these same metrics are fine as-is.

## Screen-by-screen findings

### Landing page (logged out)
- **Problem**: "6 cognitive activities" stat in the trust-building stats row is stale — the
  registry now has 15 games. **Why**: A visibly wrong number on the very first screen a
  skeptical reviewer sees undermines the "every score is genuinely computed, nothing is
  faked" claim directly above it. **Solution**: Compute this from `GAME_REGISTRY.length` at
  build/render time instead of a hardcoded string. **Priority: P0.**
- **Problem**: Visual language (icon-in-white-box feature cards, plain section dividers) is
  competent but generic — nothing distinguishes it from a template landing page. **Solution**:
  covered by the broader design-system pass (X1, typography, color). **Priority: P2.**

### Elderly Home
- **Problem**: Eight distinct card sections stack vertically with near-identical visual
  weight (mood picker, network pill, welcome banner, Today's Activity, Reminders, Talk to
  Sahaaya, My Memories, Relax). **Why**: No single strongest focal point beyond the gradient
  hero; an elderly user has to scroll and scan rather than immediately know "what do I do
  next," which is the brief's own stated success test. **Solution**: One dominant hero action
  (Today's Activity), everything else demoted to a secondary "more for later" tier — smaller,
  quieter, collapsed by default or visually subordinate. **Priority: P0.**
- **Problem**: The "Today's Activity" card shows **"Progress: 4 of 6"** — a fixed-curriculum
  count. **Why**: This is stale logic (`ElderlyHome.tsx`'s `totalGamesToday = familyMemoryCount
  >= 2 ? 6 : 5`) left over from before "Today's Activity" became an open-ended,
  AI-recommended single pick (see `GAME_ENGINE.md`) — it now contradicts what the Activities
  page itself shows ("Activity N today," no fixed total). It's not just ugly, it's
  factually wrong about how the product works today. **Solution**: Remove the fixed-total
  framing; show something honest like a streak or "X activities today" without an implied
  ceiling. **Priority: P0 (real inconsistency, not just polish).**
- **Problem**: Mood check-in, streak badge, and engagement score are all crammed into the
  header banner. **Solution**: covered by hierarchy rework above. **Priority: P1.**

### Elderly Games hub *(built last session — auditing it honestly too)*
- **Problem**: The category filter-chip row overflows horizontally with no scroll
  affordance — the last 1–2 categories are cut off at the viewport edge with nothing
  indicating more content exists sideways. **Why**: Directly contradicts "difficulty
  remembering navigation" — an elderly user has no reason to suspect they can swipe a chip
  row, so 2 of 7 categories are effectively undiscoverable via that control (they're still
  reachable by scrolling to the section directly, so nothing is truly lost, but the chip
  row itself is broken as a control). **Solution**: either wrap chips onto multiple visible
  rows instead of horizontal scroll, or add a visible fade+arrow affordance. **Priority: P0.**

### Elderly Activities ("Today's Activity")
- Covered by X4 (accuracy percentage shown as the recommendation reason). Otherwise this
  screen's structure (one big card, one CTA, a secondary "Explore" link) is good and should
  be the *model* other screens get simplified toward, not the other way around.

### My Day
- **Problem**: Shows only an empty state — "Nothing scheduled for today yet" — for the
  signed-in demo patient, with icon + text but **no primary action**. **Why**: The brief's
  own empty-state spec (§32) requires an illustration/icon, explanation, *and* a primary
  action; this has two of three. Separately, this may be a data-seeding artifact (the demo
  data likely predates several in-session date rollovers) rather than a UI bug per se, but
  the *empty-state design* itself is genuinely incomplete regardless of why it's empty.
  **Solution**: Add a clear action ("Add something to your day" / route to Reminders).
  **Priority: P1.**

### Reminders
- One of the stronger screens already — clear per-item hierarchy, prominent Done/Later
  actions, sensible grouping by type. Main issue is X3 (color semantics) above.
  **Priority: P1** (the color-semantics fix, not a rebuild).

### My Memories
- **Problem**: Category tiles use a pastel-square + emoji-in-white-badge pattern that reads
  as a generic icon-grid template rather than something emotionally warm, which is the
  screen's actual purpose per the brief (§14–15, "make it emotionally warm," "mature warmth,
  not childish"). **Solution**: This is the screen most worth a genuine illustration
  treatment — real warmth here (per the brief's own example) comes from a large family
  photo and a name/relationship, not a category-count badge grid. **Priority: P1** — visual
  refinement, not a functional gap (the category/count information itself is useful and
  should stay, just needs a warmer presentation).

### Talk to Sahaaya (voice)
- Covered by X2 (architecture note). Additionally: **Problem**: the microphone control is a
  single flat static circle with no visual state for listening/thinking/speaking/error.
  **Why**: The brief explicitly asks for a "Voice Orb" with distinct visual states for
  exactly this reason — right now a user can't tell from the UI alone whether Sahaaya heard
  them, is processing, or is about to speak. **Solution**: build the `VoiceOrb` component
  with real states wired to the existing `VoiceService`'s `VoiceState` (`idle` /`speaking`/
  `paused`/`error` already exist server-side in `useQuizVoice`/`voiceService` — this is a
  visualization gap, not a missing capability). **Priority: P0** (state is already tracked
  in code; this is "wire it to a real component," not new plumbing).

### Relax (Breathing Exercise)
- Not screenshotted with the exercise mid-cycle in this pass (verified working live in the
  prior session — see `QA_REPORT.md` Addendum 2). Static/idle-state visual treatment is
  plain (solid-color mode-picker pills) and would benefit from the same design-token pass
  as everything else. **Priority: P2.**

### Caregiver Dashboard (desktop)
- Already the strongest screen in the app — sidebar nav, KPI cards, progress rings, colored
  bars, alerts rail, quick actions. **Problem**: the 5-metric progress-ring row and the
  5-metric horizontal-bar list directly below it show **the exact same data twice** in two
  formats, back to back. **Why**: Costs significant vertical space for zero added
  information — the brief explicitly warns against "a wall of cards" / demands progressive
  disclosure. **Solution**: keep one representation as the at-a-glance view (rings, since
  they're compact) and move the bars (which add label + qualitative tag like "Fair"/"Good")
  behind "View Details," which conveniently already exists as a button on this exact card
  and currently does something else/nothing extra. **Priority: P1.**

### Caregiver Dashboard (mobile, 390px) — **genuine responsive bug, not just cramped**
- **Problem**: At mobile width, the entire sidebar (Dashboard / Cognitive Activity /
  Reminders / Memory / Alerts / Switch Role / Log Out) disappears with **no replacement
  navigation** — no hamburger menu, no bottom nav, nothing. The 5-ring engagement-profile
  row also overflows the viewport horizontally with content clipped at the right edge (the
  "Routine" ring and the "View Details" button text are cut off, not scrollable into view).
  **Why**: A caregiver who opens the link on their phone (a completely realistic scenario —
  the brief itself lists "Caregiver: desktop/tablet" as the target, but doesn't say mobile
  should be *broken*) cannot navigate anywhere except the one page they landed on, and can't
  see a fifth of the data on the page they're stuck on. **Solution**: needs a real mobile
  nav pattern for the caregiver/healthcare shell (collapsible drawer or a bottom tab bar
  scoped to those 5 sections), and the ring row needs to reflow (wrap to 2–3 per row) instead
  of overflowing. **Priority: P0.**

### Healthcare Dashboard (Patients)
- **Problem**: KPI cards at the top use large literal emoji (👥 ✅ ⚠️ 📊) as icons — the same
  X1 issue, but worth calling out specifically here because this is the one interface
  explicitly meant to read as "professional, clinical-adjacent" (§26), and generic browser
  emoji undermine that more here than anywhere else in the app. Notably the *caregiver*
  dashboard already uses proper small icon-in-circle treatment for its equivalent KPI row —
  so the fix pattern already exists in the codebase, it just wasn't applied here too.
  **Priority: P0** (inconsistency between two dashboards that should feel like siblings).
- Not yet checked at mobile width or tablet width this pass — flagged as untested, not
  assumed fine, given the caregiver dashboard's mobile breakage above.

## Priority summary

| Priority | Count | Theme |
|---|---|---|
| **P0** | 9 | Icon system, 2 leftover dev-facing text blocks, elderly-facing raw metrics, stale "4 of 6" progress claim, Games category-chip overflow, voice orb missing states, caregiver mobile nav/overflow break, healthcare KPI icon inconsistency, landing page stale stat |
| **P1** | 5 | Home screen hierarchy/density, reminder color semantics, My Day empty-state CTA, Memory category warmth, caregiver dashboard's duplicate ring/bar data |
| **P2** | 2 | Landing page generic visual template, Relax screen idle-state polish |

## What this audit deliberately does not claim

It does not claim every screen was pixel-inspected (healthcare mobile/tablet, onboarding —
there is no dedicated onboarding flow to audit today, it's demo-account quick-login only —
and the role-switch screen were not screenshotted this pass). It does not claim the
underlying functionality has problems — zero console/page errors were seen anywhere in the
sweep, and every issue above is presentational or informational, not a broken feature.

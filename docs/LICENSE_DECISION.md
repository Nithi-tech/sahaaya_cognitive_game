# License & Reuse Decision — freefocusgames Integration

**Decision: Independent reimplementation. No source code was copied from
[loethen/freefocusgames](https://github.com/loethen/freefocusgames).** The reference
repository was read only to understand game mechanics and interaction paradigms (all of
which are decades-old, public-domain cognitive-science paradigms, not the repo author's
original invention). Nothing from this decision changes if the actual license text is
later found to be more permissive than assumed here — see "What would change the
decision" at the end.

## What was actually found

1. **GitHub's own license API field is `null`** for the repository — GitHub's automated
   detector could not identify a recognized license.
2. **No `LICENSE` or `LICENSE.md` file exists in the repository at all** — confirmed by
   listing the full repo root and by direct fetch attempts for both filenames (both
   404).
3. **The README explicitly claims a license anyway**, and states its terms in plain
   English:
   > This project is licensed under the **AGPL-3.0 License** - see the [LICENSE](LICENSE)
   > file for details.
   > - ✅ Free to use for personal/educational purposes.
   > - ✅ Free to fork and modify (changes must be open-sourced).
   > - ❌ **Cannot be used in closed-source proprietary software.**

So: the license file the README points to is missing, but the author's stated intent is
unambiguous — AGPL-3.0, and explicitly **not** for use in closed-source proprietary
software.

## Why that rules out direct code reuse for SAHAAYA

Two independent reasons, either one sufficient on its own:

1. **The referenced LICENSE file doesn't exist**, so there is no complete, unambiguous,
   legally operative license text actually attached to the repository. Building a
   integration decision on an inference from a README badge and three bullet points,
   rather than an actual license grant, is not a sound basis for a real product's
   distribution model.
2. **Taking the README's stated intent at face value (the more conservative and correct
   reading) makes it worse, not better.** AGPL-3.0 is a strong copyleft license with a
   network-use clause (§13, the "Affero" clause): if AGPL-3.0-licensed code is
   incorporated into an application that users interact with **over a network** — exactly
   what SAHAAYA is, a web app served to elderly users, caregivers, and healthcare workers
   — the copyleft obligation extends to the whole combined application, not just the
   copied files. Practically: importing even one AGPL-3.0 game component into SAHAAYA
   would create a real argument that **all of SAHAAYA's source code** must be published
   under AGPL-3.0 to every user who reaches it over the network. SAHAAYA today has no
   license declaration of its own (default: all rights reserved / proprietary), and nothing
   in this project's history suggests the team has decided to make the entire codebase
   AGPL-licensed and publicly redistributable. That's a business/licensing decision far
   beyond the scope of "add five cognitive games," and not one I'm going to make
   unilaterally by importing code that carries it as a side effect.

Both conclusions point the same direction, which is why this is a clean call rather than
a judgment call: **do not copy source from this repository.**

## What was done instead

The reference repo's `config.ts` files and core game-logic files (for Dual N-Back, Stroop,
Schulte Table, Reaction Time, and Block Memory) were read — not copied — to understand:

- **Stroop** ("Color Focus"): word/ink-color congruent vs. incongruent trials, a
  configurable congruent ratio per difficulty.
- **Schulte Table** ("Number Focus"): an N×N grid of shuffled numbers, tap in ascending
  order, timed.
- **Reaction Time** ("Quick Response"): wait for a signal (random 2–6s delay), tap as fast
  as possible, averaged over several rounds, classified into speed tiers.
- **Block Memory** ("Block Memory"): a Simon-says-style spatial sequence that grows by one
  step each round; watch it highlight, then reproduce the tap sequence in order.
- **Dual N-Back** ("Dual Memory"): each trial shows a grid position (+ optionally an audio
  letter); the user indicates whether the current position/letter matches the one from
  *N* trials ago; level adjusts based on hit/miss/false-alarm accuracy.

These are all classic, published cognitive-psychology paradigms (Stroop 1935, Schulte
tables from mid-20th-century Soviet psychology, N-back from Kirchner 1958 / popularized by
Jaeggi et al. 2008, simple reaction time measurement going back over a century). The
*paradigm* isn't anyone's intellectual property; the specific React/TypeScript
implementation in that repository is, and none of it appears in SAHAAYA's version — every
game below was written from scratch, using SAHAAYA's own component patterns, state
management, difficulty model, voice integration, and design system, integrated into
SAHAAYA's own `GameDefinition` registry (see `docs/GAME_ENGINE.md`).

## What would change this decision

If the repository owner adds an actual `LICENSE` file that turns out to be permissive
(MIT, Apache-2.0, BSD) rather than AGPL-3.0, direct code reuse *could* become viable —
but that would need to be re-verified against the file that actually exists at that time,
not assumed from this document. Until then, the reimplementation-only approach stands.

## Follow-up: `extracted-games/` (a later request)

A separate request asked to merge a folder called `extracted-games/` — a dependency-closure
snapshot of 26 more game routes from the same freefocusgames repository (its own
`README.md` makes the same AGPL-3.0 claim) — into SAHAAYA. Two findings shaped the outcome:

1. **Architecture mismatch, not just a licensing one.** `extracted-games/` is a full
   Next.js 15 App Router project (next-intl, Tailwind v4, shadcn/ui, Cloudflare D1 for a
   leaderboard) — SAHAAYA is a Vite + React Router SPA with hand-rolled CSS and a custom
   i18n dictionary, and always has been. None of extracted-games' integration points
   (the `@/*` alias, Tailwind tokens, next-intl config) exist here to merge into; adopting
   them wholesale would mean migrating the whole app's framework, not integrating a folder.
2. **The same AGPL-3.0 finding applies**, so direct reuse was off the table regardless of
   the framework question.

Given both, the chosen path (confirmed with the user) was the same one this document
already established: treat `extracted-games/` as **reference material only**, and
independently reimplement a small, curated, *non-redundant* slice natively in SAHAAYA's
existing Vite architecture — not a literal folder merge. Of the 26 routes, most either
duplicate a mechanic already in SAHAAYA's registry (`dual-n-back`, `block-memory-challenge`,
`stroop-effect-test`, `schulte-table`, `reaction-time`/`focus-reaction-test`,
`memory-matching-game`) or didn't clear the bar for this pass (pure click-speed tests, a
three.js 3D embed, a productivity timer). Three were reimplemented:

- **Peripheral Awareness** (from `double-decision`): a divided-attention paradigm
  ("useful field of view") — no existing game in the registry covered this domain.
- **Memory Span** (from `free-short-term-memory-test`): verbal word-list recall — a
  different memory channel than the existing pictorial Memory Match. Two elderly-first
  departures from the source: self-paced study (not a fixed countdown) and tap-to-recognize
  recall (not typed free-text), matching how every other tap-based game in this app already
  handles input.
- **Breathing Exercise** (from `resonance-breathing`/`box-breathing`/`478-breathing` — the
  source itself is one shared component with three presets, not three separate games): a
  standalone wellness screen, deliberately **outside** the `GameDefinition` registry — see
  `GAME_ENGINE.md` for why.

All three were written from scratch against SAHAAYA's own component/voice/i18n/CSS
conventions; nothing was copied from `extracted-games/`.

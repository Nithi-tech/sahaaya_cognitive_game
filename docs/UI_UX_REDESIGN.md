# UI/UX — What Actually Changed

Read this before assuming "redesign" means what it usually means. It doesn't, here — and
that's a deliberate call, explained below.

## What this pass was NOT

Not a ground-up visual redesign. The existing design system (color tokens, spacing scale,
card/button components in `src/index.css`) was already coherent and reasonably polished
*before* this pass — verified by reading it and by using the app live. Re-skinning an
already-working design system for its own sake would have been exactly the kind of
"optimize for looking different" work the brief explicitly warned against ("Do NOT
optimize for number of features... if a feature is unnecessary, simplify it"). It also
would have eaten the time budget that instead went into fixing ~45 real, verified bugs —
a trade this document argues was the right one.

## What this pass WAS: a coherence and correctness pass

Every screen was already following *a* design system; several had quietly drifted off it
due to duplicate, diverging CSS rules (see `BUGS_FIXED.md`'s "Consistency / visual"
section). Fixing that is real UX work — a user who navigates between the reminder-chip
grid on Home and a data table on the Healthcare dashboard should feel one product, and
before this pass, two silently-competing definitions of `.badge` meant they sometimes
didn't.

Concretely, this pass:

1. **Closed the most important functional gap in the elderly UX**: no way to log out or
   switch role, anywhere. This was the one non-negotiable, explicitly-scoped ask. See
   `docs/FULL_SYSTEM_AUDIT.md` section I and `BUGS_FIXED.md`.
2. **Fixed real navigation/state bugs that read as UX failures** even though they're
   technically state bugs: progress silently resetting when leaving and returning to
   Activities, "Back to Activities" re-launching the wrong game, a reminder's "Later" tap
   producing no visible feedback at all. A UX audit that only looks at pixels and misses
   these would have missed the actual thing making the app feel broken.
3. **Made empty/loading/error states real** across ~8 screens that previously rendered
   silently blank or spun forever — the single most common way a "polished-looking" app
   actually feels broken in practice.
4. **Fixed accessibility gaps that were also, functionally, UX bugs**: two entire
   navigation actions (patient row → detail, alert banner → alerts page) were invisible
   to keyboard/screen-reader users because they were built on non-interactive elements.
   That's not a nice-to-have — for those users, those flows were simply broken.
5. **Fixed a real responsive bug**: two screens overflowed horizontally on a 414px-wide
   phone viewport (a fixed 4-column stat grid). Given this is an elderly-facing app where
   phone use is the primary case, that's not cosmetic.
6. **De-technicalized one piece of copy** ("Simulate Offline" → "Go Offline") that was
   speaking developer language on the elderly home screen.

## What was already right and left alone

- Large touch targets, big text, high-contrast cards, and calm color use were already the
  norm across the elderly screens — confirmed by using them, not just reading the CSS.
- The caregiver dashboard's information hierarchy (patient status → alerts → KPIs →
  cognitive profile → quick actions) was already sensible progressive disclosure, not a
  wall of 20 cards. Left as-is.
- The landing page redesign (hero, "how it works" section, demo-account framing) and the
  voice narration system were both built in an earlier session, not this one — see
  git history for that work. Not touched or re-litigated here.

## What a genuine follow-up visual pass would cover (not attempted here)

- A full WCAG audit (focus-visible states, skip links, landmark regions) — flagged in the
  system audit, not attempted; it's a dedicated pass, not a bolt-on to a bug-fix sweep.
- The caregiver/healthcare screens would benefit from the same "one design system,
  consistently applied" scrutiny the elderly screens got in this pass — most inline
  `borderRadius`/spacing values there are ad hoc rather than using the existing
  `--border-radius-*`/`--space-*` tokens. Noted, not fixed — it's cosmetic drift, not a
  bug, and there was real bug-fixing work with a stronger claim on the time available.

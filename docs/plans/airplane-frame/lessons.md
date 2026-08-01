# Lessons (reusable toolkit; accreted across sessions)

## GitHub Pages cannot hold flight API secrets or fix CORS

- Context: Choosing static hosting vs BFF for flight data.
- Lesson: Pages only serves files. Browser calls to third-party flight APIs still need that API to allow CORS; OAuth client secrets must not ship in front-end JS. Prefer a Worker/BFF when destination/carrier/type are required.
- Evidence: Interview research — OpenSky lacks practical browser CORS and requires OAuth2 client credentials (as of 2026); closed opensky-api#34 discussion ended on proxying.
- Crystallize?: Yes — runbook section “Why we use a Worker” + skill pointer.

## Required fields drive architecture more than hosting preference

- Context: User preferred pure client-side (A) and liked GitHub Pages.
- Lesson: If destination + carrier + plane type are non-negotiable, lock the architecture that can enrich server-side first; revisit pure static only if a spike proves a CORS-safe free stack that includes destination.
- Evidence: Interview decision to abandon A as primary after declaring fields non-negotiable.
- Crystallize?: no

## Spike before brand-locking flight APIs

- Context: Phase 1 data selection.
- Lesson: Free/trial flight APIs churn (auth, credits, schema). Write success criteria (JC pin, required fields, 5-min cadence) and keep the first stack that passes; document in tech-brief + runbook.
- Evidence: Interview lock — spike-driven data stack.
- Crystallize?: Yes — Phase 1 verify checklist in phases.md / runbook.

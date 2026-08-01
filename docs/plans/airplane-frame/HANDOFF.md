# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 5 - MVP location polish + direction note - not started
**Next action:** Write a short visual-direction note for future 1950s poster/livery work; optional geocoder UX polish if anything still hurts.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker.

**Required reading (this phase):**

- docs/plans/airplane-frame/lessons.md - reusable toolkit; reuse before re-deriving
- docs/plans/airplane-frame/product-brief.md - MVP success criteria + visual direction non-goals
- docs/plans/airplane-frame/tech-brief.md - shipped Pages + Worker pack/filter contract
- docs/plans/airplane-frame/phases.md - Phase 5 verify bar

**Index (load on demand):**

- product-brief.md - background, goals, rationale, non-goals, boundaries
- tech-brief.md - current vs proposed architecture, verified findings
- phases.md - phases + per-phase verify steps
- process.md - how we work (read before committing)
- progress-log.md - dated history of decisions/learnings/overwrites
- lessons.md - curated, accreted toolkit (carried in Required reading)
- phase-3.plan.md - Phase 3 plan (DONE)
- phase-4.plan.md - Phase 4 plan (DONE including UAT)
- phase-4.5.plan.md - Phase 4.5 plan (DONE)
- docs/runbooks/README.md - ops runbook index
- docs/runbooks/local-dev.md - local Pages + Wrangler cold start
- spike/README.md - Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md - agent entry to runbooks

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic; Phase 5 geocoder polish vs note-only.
**Open items:** Phase 4.5 Pages UAT deferred — commit/push local changes, then verify https://danjohnsonnj.github.io/airplane-frame/ (production Worker + stale UI). Local UAT PASS 2026-08-01 per `phase-4.5.plan.md`.
**Last updated:** 2026-08-01 — Phase 4.5 local UAT PASS; Pages UAT pending push

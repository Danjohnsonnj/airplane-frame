# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 5 - MVP location polish + direction note - DONE (geocoder polish deferred)
**Next action:** Design inspiration → deeper design interview → `design-mock-probe` (grill/lock before canonical mocks). See visual-direction.md.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker.

**Required reading (this phase):**

- docs/plans/airplane-frame/visual-direction.md - locked poster IA + next path
- docs/plans/airplane-frame/lessons.md - reusable toolkit; reuse before re-deriving
- docs/plans/airplane-frame/product-brief.md - MVP success criteria + visual direction non-goals
- docs/plans/airplane-frame/tech-brief.md - shipped Pages + Worker pack/filter contract
- docs/plans/airplane-frame/phases.md - Later: implement poster SPA per note

**Index (load on demand):**

- product-brief.md - background, goals, rationale, non-goals, boundaries
- tech-brief.md - current vs proposed architecture, verified findings
- phases.md - phases + per-phase verify steps
- process.md - how we work (read before committing)
- progress-log.md - dated history of decisions/learnings/overwrites
- lessons.md - curated, accreted toolkit (carried in Required reading)
- visual-direction.md - poster/settings IA locks (Phase 5 note)
- phase-3.plan.md - Phase 3 plan (DONE)
- phase-4.plan.md - Phase 4 plan (DONE including UAT)
- phase-4.5.plan.md - Phase 4.5 plan (DONE)
- docs/runbooks/README.md - ops runbook index
- docs/runbooks/local-dev.md - local Pages + Wrangler cold start (**agents start the stack**; see Agent section)
- spike/README.md - Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md - agent entry to runbooks

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic.
**Open items:** None — Phase 5 direction note DONE; geocoder polish deferred.
**Last updated:** 2026-08-01 — Phase 5 visual-direction note

# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 4 - Diversity pack + minimal filters - not started
**Next action:** Implement airport-bias + diversity-first selection to pack 3–5 flights; add saved filters (carrier allow/deny, destination group, uniqueness). Front end already shows all Worker candidates after min-altitude filter.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker.

**Required reading (this phase):**

- docs/plans/airplane-frame/lessons.md - reusable toolkit; reuse before re-deriving
- docs/plans/airplane-frame/product-brief.md - selection + filter locks
- docs/plans/airplane-frame/tech-brief.md - Worker response shape, front-end localStorage
- docs/plans/airplane-frame/phase-3.plan.md - Phase 3 shipped surface (candidates UI)

**Index (load on demand):**

- product-brief.md - background, goals, rationale, non-goals, boundaries
- tech-brief.md - current vs proposed architecture, verified findings
- phases.md - phases + per-phase verify steps
- process.md - how we work (read before committing)
- progress-log.md - dated history of decisions/learnings/overwrites
- lessons.md - curated, accreted toolkit (carried in Required reading)
- phase-3.plan.md - Phase 3 implementation plan (done pending Pages UAT)
- docs/runbooks/README.md - ops runbook index
- spike/README.md - Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md - agent entry to runbooks

**Open decisions:** Whether N is fixed or user-selectable 3–5; tune min-altitude default after real traffic; enable GitHub Pages + complete two-device UAT if not done.
**Last updated:** 2026-07-31 by Phase 3 implementation

# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 1 - Data spike - not started
**Next action:** Spike free/trial flight data sources behind a minimal Cloudflare Worker (or equivalent) and record which stack can return carrier + destination + plane type for a JC pin on a ~5-minute poll.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker.

**Required reading (this phase):**

- docs/plans/airplane-frame/lessons.md - reusable toolkit; reuse before re-deriving
- docs/plans/airplane-frame/tech-brief.md - proposed architecture, spike success criteria, open tech gaps
- docs/plans/airplane-frame/product-brief.md - locked product decisions from interview

**Index (load on demand):**

- product-brief.md - background, goals, rationale, non-goals, boundaries
- tech-brief.md - current vs proposed architecture, verified findings
- phases.md - phases + per-phase verify steps
- process.md - how we work (read before committing)
- progress-log.md - dated history of decisions/learnings/overwrites
- lessons.md - curated, accreted toolkit (carried in Required reading)

**Open decisions:** Exact API winners (spike); min altitude default; whether result count N is fixed or user-selectable 3–5.
**Last updated:** 2026-07-31 by interview→plan-build init

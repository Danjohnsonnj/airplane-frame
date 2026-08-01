# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 3 - Pages functional UI (dev location) - not started
**Next action:** Scaffold plain HTML/CSS/JS front end (JC default pin, map/coords, adjustable radius + refresh) calling `https://airplane-frame.danjohnsonnj.workers.dev/flights` with Bearer secret from localStorage; render enriched flight cards.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker.

**Required reading (this phase):**

- docs/plans/airplane-frame/lessons.md - reusable toolkit; reuse before re-deriving
- docs/plans/airplane-frame/product-brief.md - MVP fields, location UX (dev = pin)
- docs/plans/airplane-frame/tech-brief.md - Worker URL, API shape, stack
- docs/runbooks/deploy-worker.md - `/flights` auth and query params

**Index (load on demand):**

- product-brief.md - background, goals, rationale, non-goals, boundaries
- tech-brief.md - current vs proposed architecture, verified findings
- phases.md - phases + per-phase verify steps
- process.md - how we work (read before committing)
- progress-log.md - dated history of decisions/learnings/overwrites
- lessons.md - curated, accreted toolkit (carried in Required reading)
- docs/runbooks/README.md - ops runbook index
- spike/README.md - Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md - agent entry to runbooks

**Open decisions:** Min altitude default; whether N is fixed or user-selectable 3–5.
**Last updated:** 2026-07-31 by docs sync (Phase 2 closed)

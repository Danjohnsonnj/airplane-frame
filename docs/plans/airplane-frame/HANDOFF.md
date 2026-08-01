# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Design path (post–Phase 5) — poster mock probe in progress
**Next action:** Continue `design-mock-probe` on `docs/design-mocks/poster-ad-wall.html` — browser review of carrier brand colors on `.airline` (fill + `-webkit-text-stroke`); refine provisional swatches, type, status copy; optional fork: settings tag-chip chrome.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker.

**Required reading (this phase):**

- docs/agents/design-mock-probe-pointer.md - mock paths + authority
- docs/plans/airplane-frame/visual-direction.md - locked poster IA + carrier-color contract
- docs/design-reference/airline-brand-colors.md - 50 carrier hexes (regen mock via gen-carrier-css.mjs)
- docs/plans/airplane-frame/lessons.md - reusable toolkit; reuse before re-deriving
- docs/design-reference/ - intake assets cited in visual-direction
- ~/.cursor/skills/design-mock-probe/SKILL.md - mock probe workflow (main session grills; subagent builds HTML)

**Index (load on demand):**

- product-brief.md - background, goals, rationale, non-goals, boundaries
- tech-brief.md - current vs proposed architecture, verified findings
- phases.md - phases + per-phase verify steps
- process.md - how we work (read before committing)
- progress-log.md - dated history of decisions/learnings/overwrites
- lessons.md - curated, accreted toolkit
- visual-direction.md - poster/settings IA locks
- phase-3.plan.md / phase-4.plan.md / phase-4.5.plan.md - DONE phase plans
- docs/runbooks/README.md - ops runbook index
- docs/runbooks/local-dev.md - local Pages + Wrangler (**agents start the stack**)
- spike/README.md - Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md - agent entry to runbooks

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic; post-review tighten of mock-provisional tokens (swatches, type, status copy, stroke weight).
**Open items:** Poster mock under browser review (carrier colors landed); settings tag-chip chrome explore later; settings period polish, geocoder polish, livery source deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).
**Last updated:** 2026-08-01 — carrier brand colors + stroke in poster mock; gen-carrier-css.mjs; next = continue mock probe review

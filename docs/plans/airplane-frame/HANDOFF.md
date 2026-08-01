# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 6 — poster SPA UAT  
**Next action:** Run UAT in [phase-6.plan.md](./phase-6.plan.md) on local stack — brand colors for INC/legal carriers, duplicate same airline shares brand ground, unknown/trustee panels get unique swatches.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker.

**Required reading (this phase):**

- visual-direction.md - locked poster IA, panel ground, complementary ink, swatch book
- carrier-brand-alias.plan.md - INC/legal alias map + swatch uniqueness scope
- docs/design-mocks/poster-ad-wall.html - visual reference (do not port literal DOM/CSS)
- docs/design-reference/airline-brand-colors.md - 50 carrier hexes; regen mock via gen-carrier-css.mjs
- tech-brief.md - Worker `/flights` pack contract
- docs/runbooks/local-dev.md - local Pages + Wrangler (**agents start the stack**)
- process.md - how we work (read before committing)
- lessons.md - reusable toolkit

**Index (load on demand):**

- product-brief.md - background, goals, rationale, non-goals, boundaries
- tech-brief.md - current vs proposed architecture, verified findings
- phases.md - phases + per-phase verify steps
- progress-log.md - dated history of decisions/learnings/overwrites
- lessons.md - curated, accreted toolkit
- phase-3.plan.md / phase-4.plan.md / phase-4.5.plan.md / phase-6.plan.md / carrier-brand-alias.plan.md - phase plans
- docs/runbooks/README.md - ops runbook index
- spike/README.md - Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md - agent entry to runbooks

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic; settings tag-chip chrome explore later.  
**Open items:** Settings period polish, geocoder polish, livery source deferred; Phase 6 UAT pending. KV empty-aware cache hotfix deployed 2026-08-01 (see progress-log). Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).  
**Last updated:** 2026-08-01 — KV empty-aware cache hotfix deployed; Phase 6 UAT next

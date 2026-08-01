# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 6 — poster SPA implementation
**Next action:** Wire poster wall in shipped Pages app (`index.html`, `css/app.css`, `js/`) per [visual-direction.md](./visual-direction.md) locks — panel ground (brand or unique swatch), complementary hero+tag ink, row/column wall, status panel. Use [poster-ad-wall.html](../../design-mocks/poster-ad-wall.html) as visual reference only.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker.

**Required reading (this phase):**

- visual-direction.md - locked poster IA, panel ground, complementary ink, swatch book
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
- phase-3.plan.md / phase-4.plan.md / phase-4.5.plan.md - DONE phase plans
- docs/runbooks/README.md - ops runbook index
- spike/README.md - Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md - agent entry to runbooks

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic; typography faces/scales for app (mock uses Oswald + Archivo); settings tag-chip chrome explore later.
**Open items:** Poster SPA not yet wired; settings period polish, geocoder polish, livery source deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).
**Last updated:** 2026-08-01 — poster mock probe LOCKED; green-light poster implementation (Phase 6)

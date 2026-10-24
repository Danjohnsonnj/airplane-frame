---
name: docs-maintenance
description: Repo-specific OKF documentation rules. Use when updating this repo's docs/, wrapping up a session, or applying the seven-event checklist. Defers shared protocol to the global okf-docs skill.
---

# Docs maintenance (airplane-frame)

Repo-local overlay. Shared protocol: global `okf-docs` (producer profile, checklist, routing, on-write). This file holds **only** what is unique to this repo.

## Authority

code > `docs/` > agentmemory

Shipped Pages and Worker/Pi code wins over `visual-direction.md` and archived mocks. Do not “correct” `css/` or `js/` from mock HTML.

## Type-folder extensions

Default folders/types are in the producer profile. This repo also allows:

- `docs/design-reference/` — `DesignReference` (carrier hex book, airline capture notes; images sit beside the markdown)
- `docs/archive/` — retired design-mock trees (not Settled; hub **Retired** section; no OKF `type` required on HTML/SVG)

## Commands (doc-adjacent)

- `node docs/design-mocks/gen-carrier-css.mjs` — refresh `css/carriers.css`, `js/carrier-brands.js`, and archived `poster-ad-wall.html` from `airline-brand-colors.md`
- `./scripts/dev-pages.sh` / `./scripts/dev-worker.sh` — local stack (see `docs/runbooks/local-dev.md`)
- `node --test js/lib.test.js` and `cd worker && npm test`

## Code anchors

- `index.html`, `css/`, `js/` — GitHub Pages poster SPA
- `worker/` — BFF (Cloudflare Worker + Pi Node adapter)
- `docs/plans/airplane-frame/HANDOFF.md` — current phase
- `.cursor/skills/airplane-frame-ops/SKILL.md` — ops entry (not this skill)

## Migration exceptions

- `docs/design-mocks/gen-carrier-css.mjs` stays in place (production codegen). Other former `docs/design-mocks/` files live under `docs/archive/design-mocks/`.
- `docs/runbooks/README.md` was superseded by `docs/runbooks/index.md`.
- Effort tree keeps `progress-log.md` (no `log.md` in that folder). Do not create empty `docs/decisions.md`.

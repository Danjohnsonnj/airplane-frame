# Phase 6 — Poster SPA

**Status:** IMPLEMENTATION COMPLETE — UAT pending  
**Entry:** [HANDOFF.md](./HANDOFF.md)

## Decisions recorded (one path)

- **Carrier CSS:** Extend [docs/design-mocks/gen-carrier-css.mjs](../../design-mocks/gen-carrier-css.mjs) to emit `css/carriers.css` (token + `[data-carrier]` markers) and `js/carrier-brands.js` (`export const CARRIER_BRAND_NAMES` exact strings). Source of truth remains [airline-brand-colors.md](../../design-reference/airline-brand-colors.md). Mock HTML regen stays as today.
- **Typography:** Ship mock faces — Oswald + Archivo / Archivo Black via Google Fonts (visual-direction “app equivalent TBD” resolved for this phase).
- **Distance on poster tag:** Show `distanceNm` as nautical miles (e.g. `12.3 nm`). Settings list keeps current statute-mi helper until settings polish (out of scope).
- **Complementary ink:** Apply OKLCH complement + mix to **all** `.flight-panel` hero/tag zones from `--panel-color` when `@supports` allows (follow visual-direction lock; do not limit to `[data-carrier]` only if that would leave swatch panels on dual-ink only).
- **Unique grounds:** Within one pack, fallback `ground-*` swatches are unique (no repeated `--sun`, etc.). Brand-book carriers always use `data-carrier` / `--carrier-color` even when the same airline appears twice. Unknown carriers get next unused `ground-*` in order sun → navy → rose → teal → coral → mint. Status panel always `--neutral`, outside the bright set.

## Required reading

- [visual-direction.md](./visual-direction.md) — locked IA (panel ground, ink, wall, status, routing)
- [poster-ad-wall.html](../../design-mocks/poster-ad-wall.html) — visual reference only (composition, type scale, settle motion, tag layouts)
- [airline-brand-colors.md](../../design-reference/airline-brand-colors.md) — 50 carrier hexes
- [tech-brief.md](./tech-brief.md) — `/flights` JSON contract
- [local-dev.md](../../runbooks/local-dev.md) — agent starts Pages + Wrangler
- [process.md](./process.md) — before commit
- [lessons.md](./lessons.md) — Bearer vs AirLabs; local Worker IP; mock ≠ ship DOM

**Do not load** full design-reference image set or spike tree unless a carrier name mismatch needs diagnosis.

## Prerequisites

- Branch: `main` (or feature branch off `main`); working tree clean before start preferred
- Env: `worker/.dev.vars` with `APP_SHARED_SECRET` (+ AirLabs key for enrich)
- Tools: Node (front-end tests + gen script), Wrangler via `scripts/dev-worker.sh`
- User gates: local-stack UAT at end (smoke); no production deploy required to close phase unless user asks

## Out of scope

- Settings period polish / luggage-tag chip chrome fork
- Geocoder UX polish; live geolocation productization beyond existing button
- Plane/livery illustrations; city-name under dest code
- Carrier alias / ICAO normalization (exact `carrier` string ↔ brand book only)
- Changing Worker pack/filter contract
- Literal port of mock review-shell / device frames DOM

## Architecture (target)

**Ship surface:** `index.html`, `css/app.css`, `css/poster.css`, `css/carriers.css`, `js/app.js`, `js/lib.js`, `js/config.js`. Worker unchanged.

**API fields used on poster:** `carrier`, `flight`, `destination`, `origin` (nullable), `planeType`, `altitudeFt`, `distanceNm`. Response meta: `stale`, `ageSeconds`, `pack`, `candidateCount`.

## Implementation chunks

### 0 — Persist plan artifact

- Write this plan to `docs/plans/airplane-frame/phase-6.plan.md`.
- **Verify:** file exists; HANDOFF still points Phase 6 next action at poster SPA (update only on phase close).

### 1 — View shell + routing

- Restructure `index.html`: two top-level views — `#view-poster` (full-bleed wall + settings glyph) and `#view-settings` (existing settings/location/flights panels, system-first styling retained).
- Add `STORAGE_KEYS.viewSticky` in `js/config.js`.
- Routing rules (visual-direction): `?view=poster|settings` and manual toggle set sticky and win; while sticky, do not auto-bounce; default with no sticky = poster only if localStorage has non-empty secret **and** a successful `/flights` fetch, else settings.
- On boot, perform the default-route `/flights` request before switching from the settings view to poster; keep the settings view visible while that request is pending. Explicit `?view=` and sticky views render immediately and do not wait for the route decision.
- Settings glyph on poster → sticky settings; add a clear control on settings to return to poster (sticky poster).
- **Verify:** `?view=settings` and `?view=poster` stick across reload; without sticky, missing secret boots settings; with secret + live pack, boots poster.

### 2 — Carrier pipeline + pure helpers

- Extend `gen-carrier-css.mjs` to write `css/carriers.css` + `js/carrier-brands.js`; keep mock HTML blocks. Use dedicated begin/end markers in each generated file: `carrier-tokens` and `carrier-selectors` in CSS, and `carrier-brand-names` in JS; replace only those marked blocks so regeneration is idempotent and preserves hand-authored code.
- Link `css/carriers.css` from `index.html`; import brand names in app/lib.
- In `js/lib.js` add pure helpers + tests in `js/lib.test.js`:
  - `assignPanelGrounds(flights, brandNames, swatchOrder)` → per-flight `{ dataCarrier?, groundClass? }`; brand duplicates share color; swatches unique
  - `resolveWallMode({ orientation, width })` → `"rows" | "columns"` (portrait/square → rows; landscape → columns; follow content-driven spirit — use orientation landscape for columns)
  - `posterStatusKind({ flightsLength, httpError, networkError, stale, loading })` → `empty | stale | wait | err | ok`
  - `formatDistanceNm(nm)` for poster tags
- Run gen once so committed `css/carriers.css` / `js/carrier-brands.js` exist for Pages (no build step on GitHub Pages).
- **Verify:** `node docs/design-mocks/gen-carrier-css.mjs` is idempotent; `node --test js/lib.test.js` covers duplicate same-carrier brand color and unique swatch for unknowns.

### 3 — Poster CSS (intentional reimplementation)

- Add `css/poster.css` and link it from `index.html`; keep settings styles in `css/app.css`. Reimplement from locks + mock **look**, not copy-paste of review-frame chrome.
- Include: swatch `ground-*` dual-ink; `--panel-color` resolution; `@supports` complementary `--tag-ink`; row vs column tag layouts (horizontal tag in rows; bespoke vertical stack in columns — not CSS rotate); ~60/40 hero/tag; settle keyframes + `prefers-reduced-motion`; status panel on `--neutral`; corner settings glyph.
- **Verify:** static HTML smoke or local Pages: narrow viewport stacks rows; landscape columns; no hover-only controls.

### 4 — Render + fetch integration

- Replace poster-side list rendering: build `article.flight-panel` nodes (hero airline + flight#; tag dest code + route/aircraft/altitude/distance). Keep settings `#flight-list` cards for outputs.
- Wire `fetchFlights` to update poster wall, status panel fields (`EMPTY` / `STALE` / `WAIT` / `ERR` + labeled status/detail/action/updated), and existing settings status string. For stale verification, use a real stale response from the Worker after an upstream failure; if that cannot be reproduced safely during UAT, cover the same response shape with a checked-in front-end fixture or unit test rather than claiming the state was verified live.
- 401 → clear secret, pause refresh, sticky or route to settings with error status (escape hatch).
- Staged `--delay` on panels for settle; quiet status text updates.
- Wall class `rows`/`columns` from `matchMedia` + resize listener.
- **Verify:** local stack ([local-dev.md](../../runbooks/local-dev.md)): live pack renders panels; empty pack shows full-bleed status; force error (stop Worker) shows ERR; stale response surfaces STALE; unknown carriers get unique swatches; duplicate brand carriers share color.

### 5 — Docs close + automated tests

- Update HANDOFF (phase status / next action), [phases.md](./phases.md) Phase 6 status, append [progress-log.md](./progress-log.md); fold gotchas into lessons if any.
- Note in [docs/design-mocks/README.md](../../design-mocks/README.md) that gen also writes app CSS/JS.
- **Verify:** `node --test js/lib.test.js`; `cd worker && npm test` (no Worker change expected — still green).

## UAT (user)

- [ ] Cold start local Pages + Wrangler → poster with live pack (or settings if no secret)
- [ ] Mobile/narrow: row wall; rotate/wide: column wall + vertical tags
- [ ] United/Delta (INC or brand name) panels show **brand** ground (`data-carrier` + `--carrier-color`), not only sun/navy swatch rotation
- [ ] Duplicate same airline in pack → both panels use **brand** ground (not swatch fallback)
- [ ] Trustee / unknown carrier gets unique `ground-*` swatch (no repeated sun/navy within pack)
- [ ] Network error poster detail mentions `dev-worker.sh` when Worker is down
- [ ] Readable hero/tag ink on branded and swatch panels
- [ ] Empty / error / stale status luggage-tag panel; settings glyph reaches settings
- [ ] `?view=` sticky does not auto-bounce

## Commit discipline

- Commit only when user asks; read process.md first.
- Prefer small commits per chunk (shell → helpers/CSS → render → docs).

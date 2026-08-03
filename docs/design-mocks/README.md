# Design mocks — airplane-frame

Static HTML/CSS **visual reference** for poster UI. Not implementation specs — do not port DOM/CSS into the shipped Pages app without an explicit green light.

See [design-mock-probe-pointer.md](../agents/design-mock-probe-pointer.md) and [visual-direction.md](../plans/airplane-frame/visual-direction.md).

**Maintenance:** After editing [airline-brand-colors.md](../design-reference/airline-brand-colors.md), run `node gen-carrier-css.mjs` in this directory to refresh tokens in `poster-ad-wall.html`, `css/carriers.css`, and `js/carrier-brands.js`.

## Inventory

| File | Surface | Status |
|------|---------|--------|
| `poster-ad-wall.html` | Poster wall | **LOCKED** — grounds/ink (2026-08-01); filled ICAO silhouettes (2026-08-02); ship reference |
| `planes/` | ICAO silhouette assets (mock probe subset) | **LOCKED** design — RexKramer GPL-3.0 + `resolve.mjs` (`planes/_family/` OK for local mock HTTP). **Ship SoT:** `assets/planes/` + `assets/planes/family/` (no underscore — Pages/Jekyll) |

Open `poster-ad-wall.html` over local HTTP (module + fetch), e.g. `python3 -m http.server 8765 --directory docs/design-mocks`. Verify resolve: `node --test docs/design-mocks/planes/resolve.test.mjs`.

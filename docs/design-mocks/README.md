# Design mocks — airplane-frame

Static HTML/CSS **visual reference** for poster UI. Not implementation specs — do not port DOM/CSS into the shipped Pages app without an explicit green light.

See [design-mock-probe-pointer.md](../agents/design-mock-probe-pointer.md) and [visual-direction.md](../plans/airplane-frame/visual-direction.md).

**Maintenance:** After editing [airline-brand-colors.md](../design-reference/airline-brand-colors.md), run `node gen-carrier-css.mjs` in this directory to refresh tokens in `poster-ad-wall.html`.

## Inventory

| File | Surface | Status |
|------|---------|--------|
| `poster-ad-wall.html` | Poster wall | Ready for browser review — 50-carrier tokens; `.airline` brand fill + `-webkit-text-stroke` (panel-ink fallback; `contrast-color` + `color-mix` when supported) |

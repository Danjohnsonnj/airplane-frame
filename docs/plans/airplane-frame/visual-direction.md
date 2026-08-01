# Visual direction — airplane-frame

## Purpose

Compass for later poster UI work and for `design-mock-probe`. Not an implementation spec (mocks are visual reference only). User-supplied visual references may amend the intake table (cite path/link and what we take from each).

## Locked decisions

| Topic | Lock |
|-------|------|
| North star | Classic 1950s airline travel posters (lithograph / destination ads) |
| Secondary motif | Vintage airline baggage tags as a full **zone** (dominant code + labeled fields), not chrome-only chips |
| App shell | SPA with two views: full-screen **poster** (main) and **settings** (today’s fields/outputs) |
| Build order | Prototype and deliver poster first; settings stay functional/system-first; period framing of settings later |
| Responsive | **Mobile-first** (narrow portrait ~375px base); progressive enhancement with content-driven `min-width` breakpoints; touch-friendly; no hover-only affordances |
| Default routing (no `?view=`) | If localStorage looks complete **and** a flight fetch succeeds → poster; else → settings |
| Sticky override | `?view=poster` / `?view=settings` and manual view toggle override default; do not auto-bounce while sticky |
| Poster wall | Pack as panels; portrait/square = full-width **rows**; landscape = **columns**; sparse pack stretches (1 = full bleed; 2 = even split); no ghost slots |
| Panel composition | Vertical split on mobile/row base: **hero above**, **luggage tag below**. Wide may keep row packing or column packing per wall rules — not a squeezed side-by-side *inside* a narrow panel |
| Hero (flight panel) | Headline = **airline** (`carrier`); sub-hed = **flight number** (`flight`) |
| Airline brand color (mock-provisional) | Source: [airline-brand-colors.md](../../design-reference/airline-brand-colors.md). Exact `data-carrier` on Worker `carrier`; unknown → `--panel-ink`. **`.airline` only** — brand fill + `-webkit-text-stroke` (panel-ink fallback; `contrast-color` + `color-mix` when supported). CSS in [`poster-ad-wall.html`](../../design-mocks/poster-ad-wall.html) (`:root` tokens + `[data-carrier]`); regen via [`gen-carrier-css.mjs`](../../design-mocks/gen-carrier-css.mjs). Ship deferred |
| Luggage tag (flight panel) | Dominant = **destination airport code**; fields: **route** `origin → destination`, **aircraft** make/model (`planeType`), **altitude** (`altitudeFt`), **distance** (`distanceNm`). `origin` may be null (show partial route) |
| Tag orientation | **Horizontal** tag layout in **row** wall mode; **bespoke vertical** tag layout in **column** wall mode (reflowed stacking — **not** CSS-rotated horizontal art) |
| Panel colors | Closed **swatch book**; rotate saturated solid fields across the pack (**sequential** cycle). Status panel uses a **reserved neutral** outside the bright set |
| Swatch book (mock-provisional) | **Mixed warm+cool** (5–6 grounds): e.g. sun yellow → navy → dusty rose → teal → coral → mint; sequential cycle. Exact hexes chosen in mock; refine after browser review |
| Panel ink (mock-provisional) | **Dual ink:** near-black on light grounds; cream/off-white on dark grounds |
| Typography (mock-provisional) | Condensed **display** for hero (airline + quieter flight#); **heavy grotesque** for tag (ultra-bold dest code + small labels/values). Web fonts OK in mocks; app equivalent TBD. Refine after review |
| Panel split (mock-provisional) | Hero-led **~60/40** (hero above / tag below) on mobile/row base |
| Motion | Quiet state updates (fade/crossfade; status fields without bounce) **plus** short staged panel settle on load/refresh. No continuous ambient. Honor `prefers-reduced-motion` |
| Staged fidelity | Type/ephemera panels first; plane+livery illustrations later as assets exist |
| Poster chrome (mock-provisional) | Minimal **corner glyph** (gear/sliders), top-trailing, quiet. Follow-up explore later: luggage-tag chip (`SET`/`CFG`) — not this canonical mock |
| Status surface | **One luggage tag** (same visual language as flight tags); its fields carry stale / error / updating / empty copy — not a separate chrome chip |
| Status tag fields (mock-provisional) | Dominant state word (`EMPTY` / `STALE` / `WAIT` / `ERR`); labeled rows: **status**, **detail**, **action**, **updated**. Exact sentences refined in mock |
| Empty / error / updating (sticky on poster) | Single full-bleed panel: hero strip **“Nearby flights”** + status luggage tag; settings control remains (escape to settings on error) |
| API field contract (display) | Use shipped Worker row fields as-is. Gaps acked: nullable `origin`; no city-name field; `flight` is callsign; distance is nm from pin (not remaining to dest) |

## Reference intake

Confirmed 2026-08-01 from `docs/design-reference/`. Takeaways remain compass for mocks — palette/type hexes and faces are not locked here.

| Ref (path or URL) | Takeaways (palette, type, composition, reject) |
|-------------------|-----------------------------------------------|
| `docs/design-reference/luggage-tag-LAX.jpg` | Solid single field (dusty rose); ultra-bold code as hero; thinner place-name under; utilitarian black type; hairline boxes for secondary meta. **Keep:** color block + code hierarchy. **Reject:** damage-checklist density in poster panels. |
| `docs/design-reference/luggage-tag-PanAm_JFK_Split-01.jpeg` | Cream ground + navy grid; massive orange-red code; small functional labels; accent circles as whimsy without clutter. **Keep:** two-ink punch + circle accents for tag accents. **Reject:** full claim/strap form fields as UI chrome. |
| `docs/design-reference/luggage-tag-TWA_LON.jpeg` | Color-blocked header vs body; huge destination code; city line under; compact glanceable stack; one accent ink for serial-like meta (red). **Keep:** zone stacking + glance hierarchy for baggage-tag motif. |
| `docs/design-reference/poster-Hawaii.jpeg` | Solid warm yellow field + dark footer band; sparse mixed type (script + bold sans); warm/cool harmony. **Keep:** solid field + sparse high-contrast type. **Adapt:** illustration density richer than stage-1 type/ephemera panels. |
| `docs/design-reference/poster-lugano.jpg` | Vast solid sky field; destination title dominates upper third; simplified flat color shapes; cream type on blue. **Keep:** text-over-solid-field prominence + flat graphic planes. **Reject for us:** people/figures. |
| `docs/design-reference/poster-Pacific_Northwest.jpg` | Hard-edge flat color blocks; cream type on deep blue/teal; destination as wide tracked footer; carrier as top line. **Keep:** block color + type-as-structure. **Reject for us:** figures; busy multi-element scene for stage 1. |
| `docs/design-reference/poster-Philippines-Vintage-Travel.jpeg` | Solid sun-yellow field; heavy black destination; small accent script. **Keep:** field + bold title contrast. **Reject:** people/figures and dense prop illustration. |
| `docs/design-reference/poster-San_Francisco.jpg` | Solid mint sky field; large destination title; flat building planes. **Keep:** strong field + title dominance. **Reject:** people, street crowds, high illustration density. |

### Working inferences (refine in mock probes)

- **Hero fields:** Airline reads as poster headline; flight# as quieter sub-hed — not destination-as-poster-title (supersedes earlier destination-led panel hierarchy).
- **Tag fields:** Dest code dominates; route / aircraft / altitude / distance as labeled utilitarian rows (or columns in vertical tag mode).
- **Illustration stage 1:** Type + ephemera only; later art stays sparse flat shapes — no people/figures, no busy street scenes.
- **Palette feel:** Saturated solid grounds from a closed swatch book; high contrast type; optional one punch accent.
- **Reject cluster:** People, figures, dense multi-object illustration, checklist/form clutter on the poster wall; CSS-rotated tags; continuous ambient motion.

## Explicitly deferred

- Post-review tightening of swatch hexes, typefaces/scales, status copy (mock-provisional above)
- Carrier alias map / ICAO normalization (exact `data-carrier` match only in mock today)
- Build-time CSS generation for ship (mock uses `gen-carrier-css.mjs` for drift control only)
- Settings chrome fork: luggage-tag chip (explore after canonical corner-glyph mock)
- Settings period polish (framing accents)
- Illustration / livery asset source
- Geocoder UX polish
- City-name enrichment under dest code (no API field today)

## Mock inventory

| Surface | Canonical mock | Frames | Status |
|---------|----------------|--------|--------|
| Poster wall | `docs/design-mocks/poster-ad-wall.html` | Mobile row + wide column; populated + empty/error status; carrier brand colors on `.airline` | In probe — brand-color pass 2026-08-01 |

Pointer: [docs/agents/design-mock-probe-pointer.md](../../agents/design-mock-probe-pointer.md)

## Next path

1. ~~Gather design inspiration / fill Reference intake~~ (DONE 2026-08-01).
2. ~~Deeper design interview~~ (DONE 2026-08-01 — locks above).
3. **`design-mock-probe`** — review `poster-ad-wall.html` (incl. carrier brand colors on airline hero); refine provisional tokens after browser review.
4. Later (ask first): implement poster SPA against locked direction + mocks as reference only.

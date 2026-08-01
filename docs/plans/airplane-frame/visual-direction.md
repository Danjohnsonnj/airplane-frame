# Visual direction — airplane-frame

## Purpose

Compass for later poster UI work. Not an implementation spec. User-supplied visual references may amend this note (cite path/link and what we take from each).

## Locked decisions

| Topic | Lock |
|-------|------|
| North star | Classic 1950s airline travel posters (lithograph / destination ads) |
| Secondary motif | Vintage airline baggage tags — chips, labels, stamped meta only |
| App shell | SPA with two views: full-screen **poster** (main) and **settings** (today’s fields/outputs) |
| Build order | Prototype and deliver poster first; settings stay functional/system-first; period framing of settings later |
| Default routing (no `?view=`) | If localStorage looks complete **and** a flight fetch succeeds → poster; else → settings |
| Sticky override | `?view=poster` / `?view=settings` and manual view toggle override default; do not auto-bounce while sticky |
| Poster wall | Pack as panels; portrait/square = full-width rows; landscape = columns |
| Sparse pack | Stretch to fill (1 = full bleed; 2 = even split); no ghost slots |
| Panel hierarchy (type/ephemera stage) | Destination-led → carrier secondary → plane type as tag |
| Staged fidelity | Type/ephemera panels first; plane+livery illustrations later as assets exist |
| Poster chrome | Minimal settings control always available; provisional quiet age/stale/updating tag near it |
| Empty (sticky on poster) | Single full-bleed empty poster; short supporting line; settings control remains |
| Error (sticky on poster) | Same empty-poster layout; clearer cause copy + tag-style meta; settings is the escape |

## Reference intake

Confirmed 2026-08-01 from `docs/design-reference/`. Takeaways are compass for interview + mock probes — not palette/type locks. Refine via `design-mock-probe`.

| Ref (path or URL) | Takeaways (palette, type, composition, reject) |
|-------------------|-----------------------------------------------|
| `docs/design-reference/luggage-tag-LAX.jpg` | Solid single field (dusty rose); ultra-bold code as hero; thinner place-name under; utilitarian black type; hairline boxes for secondary meta. **Keep:** color block + code hierarchy. **Reject:** damage-checklist density in poster panels. |
| `docs/design-reference/luggage-tag-PanAm_JFK_Split-01.jpeg` | Cream ground + navy grid; massive orange-red code; small functional labels; accent circles as whimsy without clutter. **Keep:** two-ink punch + circle accents for tag/status chips. **Reject:** full claim/strap form fields as UI chrome. |
| `docs/design-reference/luggage-tag-TWA_LON.jpeg` | Color-blocked header vs body; huge destination code; city line under; compact glanceable stack; one accent ink for serial-like meta (red). **Keep:** zone stacking + glance hierarchy for baggage-tag motif. |
| `docs/design-reference/poster-Hawaii.jpeg` | Solid warm yellow field + dark footer band; sparse mixed type (script + bold sans); warm/cool harmony. **Keep:** solid field + sparse high-contrast type + footer carrier band idea. **Adapt:** illustration density (plane/landscape) richer than stage-1 type/ephemera panels. |
| `docs/design-reference/poster-lugano.jpg` | Vast solid sky field; destination title dominates upper third; simplified flat color shapes; cream type on blue. **Keep:** text-over-solid-field prominence + flat graphic planes. **Reject for us:** people/figures. |
| `docs/design-reference/poster-Pacific_Northwest.jpg` | Hard-edge flat color blocks; cream type on deep blue/teal; destination as wide tracked footer; carrier as top line. **Keep:** block color + type-as-structure. **Reject for us:** figures; busy multi-element scene for stage 1. |
| `docs/design-reference/poster-Philippines-Vintage-Travel.jpeg` | Solid sun-yellow field; heavy black destination; small accent script. **Keep:** field + bold title contrast. **Reject:** people/figures and dense prop illustration. |
| `docs/design-reference/poster-San_Francisco.jpg` | Solid mint sky field; large destination title; flat building planes. **Keep:** strong field + title dominance. **Reject:** people, street crowds, high illustration density. |

### Working inferences (refine via mock probes — not locks)

- **Poster panels:** Full-bleed solid field per panel; destination type as hero; carrier secondary (band or smaller line); plane type as tag chip, not scene filler.
- **Illustration stage 1:** Type + ephemera over scenic art; later art stays sparse flat shapes — no people/figures, no busy street scenes.
- **Palette feel:** Saturated solid grounds; limited inks; high contrast type (cream-on-deep or dark-on-warm); optional one punch accent (Pan Am circles / TWA red serial).
- **Tag motif:** LAX/TWA glance stack + Pan Am circle whimsy for status/meta chips — not full form grids.
- **Reject cluster:** People, figures, dense multi-object illustration, checklist/form clutter on the poster wall.

## Explicitly deferred

- Palette, typography, and motion details (intake informs; locks after interview / mock probes)
- Settings period polish (framing accents)
- Final form of the poster status tag
- Illustration / livery asset source
- Geocoder UX polish

## Next path

1. ~~Gather design inspiration / fill Reference intake~~ (DONE 2026-08-01).
2. Deeper design interview (resolve deferred items, including status-tag treatment).
3. `design-mock-probe` — grill/lock before canonical mocks; refine intake inferences there.

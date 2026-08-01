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

| Ref (path or URL) | Takeaways (palette, type, composition, reject) |
|-------------------|-----------------------------------------------|
| *(none yet)* | |

## Explicitly deferred

- Palette, typography, and motion details
- Settings period polish (framing accents)
- Final form of the poster status tag
- Illustration / livery asset source
- Geocoder UX polish

## Next path

1. Gather design inspiration (and optionally fill **Reference intake**).
2. Deeper design interview (resolve deferred items, including status-tag treatment).
3. `design-mock-probe` Cursor skill — grill/lock before canonical mocks.

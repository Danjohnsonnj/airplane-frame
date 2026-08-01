# Phase 3 plan — Pages functional UI

**Status:** DONE 2026-07-31 (Pages enabled + two-device UAT PASS)  
**Entry:** [HANDOFF.md](./HANDOFF.md) → this file  
**Prerequisites:** Worker live at `https://airplane-frame.danjohnsonnj.workers.dev`; you know `APP_SHARED_SECRET` (from Wrangler secrets / `worker/.dev.vars` — never commit it)

## Decisions locked for this plan

| Topic | Choice |
|-------|--------|
| Flight list | Show **all** Worker-returned flights (after altitude filter); diversity 3–5 is Phase 4 |
| Location | JC default + **map click** + **place/address search** (free geocoder) + **Use my location** (all three) |
| Pages layout | Repo **root** (`index.html`, `css/`, `js/`) |
| Min altitude | User control in UI; default **5000 ft**; filter **client-side** on `altitudeFt` (Worker already drops ground) |
| Done bar | GitHub Pages enabled + two-device UAT |

**Scope note:** Place search was Phase 5; device geolocation was “Later”. Both are pulled into Phase 3 per your answers. Phase 5 then shrinks to visual-direction note (+ any geocoder polish).

## Required reading (executor)

- [product-brief.md](./product-brief.md) — MVP fields, location UX
- [tech-brief.md](./tech-brief.md) — Worker URL, API shape, localStorage
- [lessons.md](./lessons.md) — no secrets on Pages; Worker CORS
- [deploy-worker.md](../../runbooks/deploy-worker.md) — `/flights` auth + query params

Do **not** need: spike code, Worker rewrite (unless CORS/auth regression).

## Out of scope

- Diversity pack / filters (Phase 4)
- 1950s poster art / liveries
- Worker `minAlt` query param (client filter only)
- Changing data vendors or paid tiers
- Putting `AIRLABS_API_KEY` or any third-party API secret in front-end source

## Goals

1. Functional plain HTML/CSS/JS site at repo root, deployable via GitHub Pages.
2. Persist pin, radius, refresh interval, min altitude, and shared secret in `localStorage`.
3. Call Worker `GET /flights?lat=&lon=&radiusMi=` with `Authorization: Bearer <secret>`; render every returned flight that passes min altitude, each showing carrier, destination, plane type (+ flight id, altitude, distance, origin when present).
4. Location: default Jersey City (`40.728`, `-74.078`); map click to set pin; place search → lat/lon; optional browser geolocation.
5. Pass two-device UAT on the Pages URL.

## Files to add / change

| Path | Action |
|------|--------|
| `index.html` | **Add** — structure: settings (secret, radius, refresh, min alt), location (search, geo button, lat/lon display), map, flight list, status |
| `css/app.css` | **Add** — functional layout; mobile-usable; no poster art |
| `js/app.js` | **Add** — storage, Worker fetch, render, refresh timer, geocode, geolocation, map wiring |
| `js/config.js` | **Add** — `WORKER_BASE`, JC defaults, `localStorage` keys, default radius 25 mi / refresh 300s / minAlt 5000 |
| `README.md` | **Add** — Pages URL placeholder, how to enter shared secret, link to runbooks |
| `docs/runbooks/pages.md` | **Add** — enable Pages (root), local preview (`npx serve` or `python -m http.server`), UAT checklist |
| `.cursor/skills/airplane-frame-ops/SKILL.md` | **Update** — pointer to `pages.md` |
| `docs/runbooks/README.md` | **Update** — index `pages.md` |
| Plan briefs | **Update on wrap-up** — HANDOFF next action → Phase 4; tech/product/phases/progress-log/lessons as needed |

No Worker code changes required for the happy path (CORS already `*`; flights include `altitudeFt`).

## API contract (consume as-is)

```
GET https://airplane-frame.danjohnsonnj.workers.dev/flights?lat={lat}&lon={lon}&radiusMi={mi}
Authorization: Bearer {APP_SHARED_SECRET}
→ 200 { pin, count, flights[{ flight, carrier, destination, origin, planeType, altitudeFt, distanceNm, ... }], cachedForSeconds }
→ 401 unauthorized | 400 bad query | 502 upstream_failed
```

Never display a row missing carrier, destination, or planeType (Worker already enforces; UI should still guard).

## Implementation steps

### 1. Scaffold static site

Create `index.html`, `css/app.css`, `js/config.js`, `js/app.js` with JC defaults and empty flight list / status area.

**Verify:** `cd` repo root → `python3 -m http.server 8080` → open `http://127.0.0.1:8080/` → page loads without console errors.

### 2. Settings + localStorage

Fields: shared secret, radius (mi), refresh interval (seconds), min altitude (ft). Persist on change. Secret never logged to console or committed.

**Verify:** set values → reload → same values restored.

### 3. Wire Worker fetch + render

On Refresh (and on interval when secret + pin present): fetch `/flights`, filter `altitudeFt >= minAltitudeFt`, render cards. Show clear errors for 401 / network / empty after filter.

**Verify:** with valid secret + JC pin → cards with required fields; wrong secret → visible 401; raise min alt high → fewer/no cards without crashing.

### 4. Map pin (Leaflet + OSM tiles)

Embed Leaflet from a CDN. Show pin; click map updates lat/lon and persists. No map API key.

**Verify:** click away from JC → coords update → Refresh uses new pin.

### 5. Place search + geolocation

- Place search: free geocoder usable from the browser (prefer one with CORS; document UA/rate-limit in lessons if needed). On pick, set pin + map.
- Button: `navigator.geolocation.getCurrentPosition` → set pin (handle denial gracefully).

**Verify:** search “Jersey City” (or similar) sets a sensible pin; geolocation works when permitted (or shows a clear denial message).

### 6. Auto-refresh

Interval from settings (default 300s). Changing interval resets timer. Manual Refresh always available.

**Verify:** short interval (e.g. 30s) in local preview triggers a second fetch; status shows last-updated time.

### 7. README + pages runbook + skill index

Document Pages enable (Settings → Pages → Deploy from branch `main` / root), local preview, secret entry, UAT steps. Link from ops skill + runbooks README.

**Verify:** links resolve; steps match repo layout.

### 8. GitHub Pages + two-device UAT

Push (when user asks to commit/push). Enable Pages. Open Pages URL on device A and B; enter same secret; confirm enriched flights within one refresh cycle.

**Verify checklist (UAT):**

- [ ] Pages URL serves `index.html` over HTTPS
- [ ] Device A: set/search pin, see enriched cards (carrier, destination, plane type)
- [ ] Radius / min alt / refresh behave as expected
- [ ] Device B: same secret → flights load (own localStorage for pin OK)
- [ ] Wrong secret → unauthorized, no silent empty success

### 9. Session handoff (after UAT pass)

Overwrite tech-brief (Phase 3 done), product-brief (location UX now includes search + geo), phases.md Phase 3 DONE, HANDOFF → Phase 4 next action, append progress-log, fold Pages/geocoder gotchas into lessons. Commit only if user asks.

## Defaults

| Key | Default |
|-----|---------|
| lat / lon | `40.728` / `-74.078` (Jersey City) |
| radiusMi | `25` |
| refreshSeconds | `300` |
| minAltitudeFt | `5000` |
| Worker base | `https://airplane-frame.danjohnsonnj.workers.dev` |

## Open after Phase 3 (not blocking)

- Whether Phase 4 still needs place-search polish
- Min altitude default may be tuned after real JC traffic
- N = 3–5 remains a Phase 4 concern (UI shows all candidates until then)

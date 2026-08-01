# Tech brief - current state and gaps

## Current architecture (verified)

- Plan artifacts: `docs/plans/airplane-frame/`
- Ops: `docs/runbooks/` + `.cursor/skills/airplane-frame-ops`
- Phase 1 spike: `spike/` (`run_spike.py`, `CREDENTIALS.md`, `README.md`) — **locked**
- Phase 2 Worker: `worker/` — **deployed and verified**
  - URL: **https://airplane-frame.danjohnsonnj.workers.dev**
  - Subdomain: `danjohnsonnj.workers.dev`
  - Auth: `Authorization: Bearer <APP_SHARED_SECRET>`
  - Pipeline: airplanes.live → AirLabs (hexdb fallback) → JSON
  - Cache: ~300s per lat/lon/radiusNm bucket (`CACHE_TTL_SECONDS`)
  - UI radius query param `radiusMi` (statute) → nm via `milesToNm` (~25 mi → 22 nm)
- Phase 3 Pages UI: **DONE** — root site + https://danjohnsonnj.github.io/airplane-frame/ ; two-device UAT PASS 2026-07-31

## Locked data stack (Phase 1)

| Role | Source | Auth | Notes |
|------|--------|------|-------|
| Live positions + plane type | [airplanes.live](https://airplanes.live/api-guide/) `/v2/point/{lat}/{lon}/{radius}` | None | Radius in **nautical miles** (max 250). Requires `User-Agent`. ~1 req/s. |
| Carrier + origin/destination | [AirLabs](https://airlabs.co/docs/) `flight_icao` | `AIRLABS_API_KEY` | Prefer over `ownOp` / hexdb. Enrich capped (`MAX_ENRICH`, default 12). |
| Destination fallback | hexdb.io `/api/v1/route/icao/{callsign}` | None | Stale risk; only if AirLabs misses destination. |

**Not in MVP stack:** Aviationstack, OpenSky (optional later), adsb.lol routeset.

## Verified findings / gaps

1. Worker required for AirLabs key + CORS-safe front end — **done**.
2. Keys only in `spike/.env` / `worker/.dev.vars` / Wrangler secrets — never `*.example`.
3. Diversity pack + filters still Phase 4; Worker currently returns up to `MAX_RESULTS` (20) enriched candidates.
4. Statute↔nm conversion implemented in Worker (`auth.js` / query parsing).
5. Fresh workers.dev TLS can fail briefly until subdomain + `workers_dev = true` settle — see deploy runbook / lessons.

## Architecture

```
[Browser: plain HTML/CSS/JS — repo root; GitHub Pages]
   |  Authorization: Bearer APP_SHARED_SECRET (localStorage)
   |  Query: lat, lon, radiusMi; client min-altitude filter
   |  Location: JC default, map click, Open-Meteo place search, device geolocation
   v
[Worker https://airplane-frame.danjohnsonnj.workers.dev]
   |  secrets: AIRLABS_API_KEY, APP_SHARED_SECRET
   |  cache ~5 min; airplanes.live → AirLabs → hexdb fallback
   |  require carrier + destination + planeType
   v
[JSON: { pin, count, flights[] }]  → UI shows all after minAltitudeFt filter
                                    → Phase 4: diversity pack down to 3–5
```

### Front end (Phase 3 DONE)

- Modern browsers (last ~1 year)
- `localStorage`: home pin, radius, refresh interval, min altitude, **`APP_SHARED_SECRET` only** (never `AIRLABS_API_KEY`; 401 clears stored secret and pauses auto-refresh)
- Location: JC default; map click (Leaflet/OSM); place search (Open-Meteo geocoder); device geolocation
- Functional UI only; no poster art
- Unit tests: `node --test js/lib.test.js`
- Live: https://danjohnsonnj.github.io/airplane-frame/

### Worker (live)

- `GET /health`, `GET /flights`
- Shared-secret gate + ~5 min cache
- Phase 4: diversity pack down to 3–5

## Hard invariants

- No third-party API secrets in front-end source or Pages-deployed JS
- Never display a flight missing carrier, destination, or plane type
- Free/trial data sources only unless user explicitly approves otherwise
- Personal access gate on the Worker (shared secret)
- Primary enrichment: AirLabs; hexdb fallback only

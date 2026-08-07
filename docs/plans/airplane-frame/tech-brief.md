# Tech brief - current state and gaps

## Current architecture (verified)

- Plan artifacts: `docs/plans/airplane-frame/`
- Ops: `docs/runbooks/` + `.cursor/skills/airplane-frame-ops`
- Phase 1 spike: `spike/` (`run_spike.py`, `CREDENTIALS.md`, `README.md`) — **locked**
- Phase 2 Worker: `worker/` — **deployed and verified**
  - URL: **https://airplane-frame.danjohnsonnj.workers.dev**
  - Subdomain: `danjohnsonnj.workers.dev`
  - Auth: `Authorization: Bearer <APP_SHARED_SECRET>`
  - Pipeline: airplanes.live → adsbdb/`ownOp` first → AirLabs gap-fill (capped) → filter/pack → JSON
  - Outbound fetches: `FETCH_TIMEOUT_MS` 10s (`AbortSignal.timeout`); adsbdb hard failure (timeout / network / 5xx / 429) → `{ _adsbdbUnavailable }` and **request-scoped skip** of further adsbdb; soft 400/404 keeps trying
  - Candidate cache: Workers KV `FLIGHT_CACHE` ~600s fresh for non-empty (`CACHE_TTL_SECONDS`); empty fresh window `EMPTY_CACHE_TTL_SECONDS` (60); stale fallback up to `STALE_TTL_SECONDS` (3600); prefer last-good pack when upstream returns empty; filters re-pack without re-enrich; `enrich` stats on response only (not persisted). **Callsign enrich cache** (same KV / Pi file): keys `cs:{CALLSIGN}` (positive display triple), `cs:miss:adsbdb:{CS}` (400/404 only), `cs:miss:airlabs:{CS}`; value-embedded TTL (`CALLSIGN_CACHE_TTL_SECONDS` 900, `CALLSIGN_NEG_ADSBDB_TTL_SECONDS` 600, `CALLSIGN_NEG_AIRLABS_TTL_SECONDS` 1800); skips repeat adsbdb/AirLabs within TTL; stats `callsignCacheHits`. Display fields only — no route DB mirror; short-TTL risk accepted for personal use. **Pi `FileKv` ignores `expirationTtl`** — clear `/var/lib/airplane-frame/cache.json` manually when stuck on ancient stale packs
  - Pack: `PACK_SIZE` default 10; diversity-first + airport-interest tie-break (`worker/src/pack.js`)
  - Enrich caps: `MAX_ATTEMPT` (default 36; legacy `MAX_ENRICH` fallback), `MAX_AIRLABS` (default 5), `MAX_RESULTS` (default 20)
  - UI radius query param `radiusMi` (statute) → nm via `milesToNm` (~25 mi → 22 nm; nm clamped ≤250)
- Phase 3 Pages UI: **DONE** — https://danjohnsonnj.github.io/airplane-frame/
- Phase 4 pack + filters: **DONE** 2026-07-31 (UAT PASS)
- Phase 4.5 KV/stale + local dev: **DONE** 2026-08-01 — KV cache, stale serve, `resolveWorkerBase`, `scripts/dev-*.sh`, local-dev runbook

## Locked data stack (Phase 1)

| Role | Source | Auth | Notes |
|------|--------|------|-------|
| Live positions + plane type | [airplanes.live](https://airplanes.live/api-guide/) `/v2/point/{lat}/{lon}/{radius}` | None | Radius in **nautical miles** (max 250). Requires `User-Agent`. ~1 req/s. |
| Destination + carrier (primary path) | [adsbdb](https://www.adsbdb.com/) `GET /v0/callsign/{callsign}` + airplanes.live `ownOp` | None | Tried first per aircraft; airline-ish callsigns preferred. Route data: David Taylor / Jim Mason via adsbdb — public GET only; do not mirror DB (docs attribution). |
| Carrier + origin/destination (gap-fill) | [AirLabs](https://airlabs.co/docs/) `flight_icao` | `AIRLABS_API_KEY` | Only when adsbdb/`ownOp` incomplete; hard cap `MAX_AIRLABS` (default 5) per fresh fetch; quota/key errors trip a per-fetch breaker. |

**Not in MVP stack:** Aviationstack, OpenSky (optional later), adsb.lol routeset, hexdb.io (removed 2026-08-03).

## Verified findings / gaps

1. Worker required for AirLabs key + CORS-safe front end — **done**.
2. Keys only in `spike/.env` / `worker/.dev.vars` / Wrangler secrets — never `*.example`.
3. Diversity pack + filters — **done** (Phase 4).
4. Statute↔nm conversion implemented in Worker (`auth.js` / query parsing).
5. Fresh workers.dev TLS can fail briefly until subdomain + `workers_dev = true` settle — see deploy runbook / lessons.
6. Cache enriched **candidates**, then apply filters/pack per request — filter changes do not burn AirLabs within TTL.
7. **Production blocker (2026-08-02):** airplanes.live rate-limits ~1 req/s **per IP**. Cloudflare Workers egress uses a **shared IP pool**, so production `/flights` often gets 429 / empty while local Wrangler (own IP) succeeds. KV empty-aware cache + stale serve reduce EMPTY frequency but **do not** provide dedicated egress.
8. **Egress path live (2026-08-02):** Production API **`https://api.danjnj.com`** via Tunnel `airplane-frame-pi` → Pi Node adapter `127.0.0.1:8788`. Zone `danjnj.com` Active; Squarespace `www` DNS-only. Pi `mypi` arm64, Node 20, systemd (`airplane-frame-worker` + sync timer) + `cloudflared` enabled for boot. Pages on `main` calls the tunnel; `?worker=cloudflare` → legacy `workers.dev`. Ops: [pi-worker.md](../../runbooks/pi-worker.md). Phase 6 poster polish deferred.
9. **hexdb outage (2026-08-03):** Without timeouts, `/flights` hung. Shipped: 10s fetch timeout + request-scoped skip (`e744e6a`). Packs stayed thin (~≤`MAX_AIRLABS`) while hexdb was primary.
10. **adsbdb first-pass (2026-08-03):** Replaced hexdb with [adsbdb](https://www.adsbdb.com/) `GET /v0/callsign/{CALLSIGN}` — shipped `343882b` on `main`. Soft 400/404 = miss; timeout/network/5xx/429 = request-scoped skip. Local + Pi production UAT PASS.
11. **Callsign enrichment cache (2026-08-03):** Short-TTL display-field cache in `FLIGHT_CACHE` closes exploration B. Positive hits from adsbdb or AirLabs; source-tagged negatives; hard fails never cached. AirLabs is the only paid API-key quota source — cache reduces repeat gap-fill cost. Policy: display-only, no DB mirror; risk accepted per exploration B.

## Architecture

```
[Browser: plain HTML/CSS/JS — repo root; GitHub Pages]
   |  Authorization: Bearer APP_SHARED_SECRET (localStorage)
   |  Query: lat, lon, radiusMi, minAltitudeFt, carrierAllow/Deny,
   |         destGroup(+Mode), unique, sortByDistance
   |  Location: JC default, map click, Open-Meteo place search, device geolocation
   v
[TODAY] Worker https://airplane-frame.danjohnsonnj.workers.dev  (shared egress — rate-limit prone)
[TARGET] https://api.danjnj.com  (Tunnel → Pi Node adapter; home egress)
         ?worker=cloudflare → legacy workers.dev rollback
   |  secrets: AIRLABS_API_KEY, APP_SHARED_SECRET (Pi env / Worker secrets)
   |  cache: KV (Worker) or file FLIGHT_CACHE (Pi); airplanes.live → adsbdb/ownOp → AirLabs (capped)
   |  stale serve on upstream failure; filter + diversity pack (≤ PACK_SIZE)
   v
[JSON: { pin, count, candidateCount, flights[], pack, enrich, stale, ageSeconds, cachedForSeconds }]
   → UI renders pack (completeness guard only)
```

### Front end (Phase 3–4 DONE)

- Modern browsers (last ~1 year)
- `localStorage`: home pin, radius, auto-refresh toggle (default off), refresh interval, min altitude, filters, **`APP_SHARED_SECRET` only**
- Location: JC default; map click (Leaflet/OSM); place search (Open-Meteo); device geolocation
- Shipped: functional UI only; no poster art. Target poster-main / settings-secondary IA: [visual-direction.md](./visual-direction.md). Design mocks: `docs/design-mocks/` (pointer `docs/agents/design-mock-probe-pointer.md`); do not implement poster SPA until asked.
- Unit tests: `node --test js/lib.test.js`
- Local: `127.0.0.1:8080` → `resolveWorkerBase` → local Wrangler `:8788` (or `?worker=prod` → Pi API / `?worker=cloudflare` → workers.dev)
- Live: https://danjohnsonnj.github.io/airplane-frame/

### Worker (live)

- `GET /health`, `GET /flights` (pack + optional filters — see deploy-worker runbook)
- Shared-secret gate; KV candidate cache + stale fallback; `PACK_SIZE` default 10
- Enrich: adsbdb/`ownOp` first; AirLabs gap-fill under `MAX_AIRLABS`; response includes `enrich` stats (`adsbdbCalls`, `adsbdbSkipped`, `callsignCacheHits`)

## Hard invariants

- No third-party API secrets in front-end source or Pages-deployed JS
- Never display a flight missing carrier, destination, or plane type
- Free/trial data sources only unless user explicitly approves otherwise
- Personal access gate on the Worker (shared secret)
- Enrichment: adsbdb/`ownOp` first; AirLabs only for incomplete rows within `MAX_AIRLABS`

# Tech brief - current state and gaps

## Current architecture (verified)

- Plan artifacts: `docs/plans/airplane-frame/`
- Ops: `docs/runbooks/` + `.cursor/skills/airplane-frame-ops`
- Phase 1 spike: `spike/` (`run_spike.py`, `CREDENTIALS.md`, `README.md`) — **locked**
- Phase 2 Worker: `worker/` — **deployed and verified**
  - URL: **https://airplane-frame.danjohnsonnj.workers.dev**
  - Subdomain: `danjohnsonnj.workers.dev`
  - Auth: `Authorization: Bearer <APP_SHARED_SECRET>`
  - Pipeline: airplanes.live → hexdb/`ownOp` first → AirLabs gap-fill (capped) → filter/pack → JSON
  - Outbound fetches: `FETCH_TIMEOUT_MS` 10s (`AbortSignal.timeout`); hexdb hard failure (timeout / network / 5xx) → `{ _hexdbUnavailable }` and **request-scoped skip** of further hexdb; soft 404 keeps trying
  - Candidate cache: Workers KV `FLIGHT_CACHE` ~600s fresh for non-empty (`CACHE_TTL_SECONDS`); empty fresh window `EMPTY_CACHE_TTL_SECONDS` (60); stale fallback up to `STALE_TTL_SECONDS` (3600); prefer last-good pack when upstream returns empty; filters re-pack without re-enrich; `enrich` stats on response only (not persisted). **Pi `FileKv` ignores `expirationTtl`** — clear `/var/lib/airplane-frame/cache.json` manually when stuck on ancient stale packs
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
| Destination + carrier (primary path) | hexdb.io `/api/v1/route/icao/{callsign}` + airplanes.live `ownOp` | None | Tried first per aircraft; airline-ish callsigns preferred. **2026-08-03:** hexdb upstream hang/502 — worker times out + skips further hexdb per request. |
| Carrier + origin/destination (gap-fill) | [AirLabs](https://airlabs.co/docs/) `flight_icao` | `AIRLABS_API_KEY` | Only when hexdb/`ownOp` incomplete; hard cap `MAX_AIRLABS` (default 5) per fresh fetch; quota/key errors trip a per-fetch breaker. While hexdb is skipped, packs are ~≤`MAX_AIRLABS`. |

**Not in MVP stack:** Aviationstack, OpenSky (optional later), adsb.lol routeset.

**Candidate fallback (exploration B, locked next — not shipped):** [adsbdb](https://www.adsbdb.com/) `GET https://api.adsbdb.com/v0/callsign/{CALLSIGN}` — keyless; returns origin/destination + `airline.name`. Live OK when hexdb was down (2026-08-03). Not a JSON/URL drop-in; needs adapter. Route-data attribution/restrictions in adsbdb README — use public GET only, do not mirror DB.

## Verified findings / gaps

1. Worker required for AirLabs key + CORS-safe front end — **done**.
2. Keys only in `spike/.env` / `worker/.dev.vars` / Wrangler secrets — never `*.example`.
3. Diversity pack + filters — **done** (Phase 4).
4. Statute↔nm conversion implemented in Worker (`auth.js` / query parsing).
5. Fresh workers.dev TLS can fail briefly until subdomain + `workers_dev = true` settle — see deploy runbook / lessons.
6. Cache enriched **candidates**, then apply filters/pack per request — filter changes do not burn AirLabs within TTL.
7. **Production blocker (2026-08-02):** airplanes.live rate-limits ~1 req/s **per IP**. Cloudflare Workers egress uses a **shared IP pool**, so production `/flights` often gets 429 / empty while local Wrangler (own IP) succeeds. KV empty-aware cache + stale serve reduce EMPTY frequency but **do not** provide dedicated egress.
8. **Egress path live (2026-08-02):** Production API **`https://api.danjnj.com`** via Tunnel `airplane-frame-pi` → Pi Node adapter `127.0.0.1:8788`. Zone `danjnj.com` Active; Squarespace `www` DNS-only. Pi `mypi` arm64, Node 20, systemd (`airplane-frame-worker` + sync timer) + `cloudflared` enabled for boot. Pages on `main` calls the tunnel; `?worker=cloudflare` → legacy `workers.dev`. Ops: [pi-worker.md](../../runbooks/pi-worker.md). Phase 6 poster polish deferred.
9. **hexdb outage (2026-08-03):** Without timeouts, `/flights` hung (cloudflared `context canceled`; browser CORS+502 on Tunnel errors). Shipped: 10s fetch timeout + request-scoped hexdb skip (`e744e6a`). Live UAT: packs recover via AirLabs but stay thin (~4–5) at `MAX_AIRLABS=5`. Sync timer was also broken (`runuser` not on unit PATH) — fixed `59690a5` / Pi unit PATH includes `/usr/sbin:/sbin`.
10. **Next exploration (locked 2026-08-03): B — adsbdb first-pass.** Replace hexdb with [adsbdb](https://www.adsbdb.com/) `GET https://api.adsbdb.com/v0/callsign/{CALLSIGN}` (keyless; nested origin/destination + `airline.name`; adapter required). Keep AirLabs gap-fill, 10s fetch timeouts, and request-scoped hard-fail skip (point at adsbdb). Soft 404 = miss. Respect adsbdb route-data terms (public GET only; do not mirror DB).
    - **Parked:** **A** — raise Pi `MAX_AIRLABS` (ops-only) if B is delayed and thin packs are unacceptable.

## Architecture

```
[Browser: plain HTML/CSS/JS — repo root; GitHub Pages]
   |  Authorization: Bearer APP_SHARED_SECRET (localStorage)
   |  Query: lat, lon, radiusMi, minAltitudeFt, carrierAllow/Deny,
   |         destGroup(+Mode), unique
   |  Location: JC default, map click, Open-Meteo place search, device geolocation
   v
[TODAY] Worker https://airplane-frame.danjohnsonnj.workers.dev  (shared egress — rate-limit prone)
[TARGET] https://api.danjnj.com  (Tunnel → Pi Node adapter; home egress)
         ?worker=cloudflare → legacy workers.dev rollback
   |  secrets: AIRLABS_API_KEY, APP_SHARED_SECRET (Pi env / Worker secrets)
   |  cache: KV (Worker) or file FLIGHT_CACHE (Pi); airplanes.live → hexdb/ownOp → AirLabs (capped)
   |  stale serve on upstream failure; filter + diversity pack (≤ PACK_SIZE)
   v
[JSON: { pin, count, candidateCount, flights[], pack, enrich, stale, ageSeconds, cachedForSeconds }]
   → UI renders pack (completeness guard only)
```

### Front end (Phase 3–4 DONE)

- Modern browsers (last ~1 year)
- `localStorage`: home pin, radius, refresh, min altitude, filters, **`APP_SHARED_SECRET` only**
- Location: JC default; map click (Leaflet/OSM); place search (Open-Meteo); device geolocation
- Shipped: functional UI only; no poster art. Target poster-main / settings-secondary IA: [visual-direction.md](./visual-direction.md). Design mocks: `docs/design-mocks/` (pointer `docs/agents/design-mock-probe-pointer.md`); do not implement poster SPA until asked.
- Unit tests: `node --test js/lib.test.js`
- Local: `127.0.0.1:8080` → `resolveWorkerBase` → local Wrangler `:8788` (or `?worker=prod` → Pi API / `?worker=cloudflare` → workers.dev)
- Live: https://danjohnsonnj.github.io/airplane-frame/

### Worker (live)

- `GET /health`, `GET /flights` (pack + optional filters — see deploy-worker runbook)
- Shared-secret gate; KV candidate cache + stale fallback; `PACK_SIZE` default 10
- Enrich: hexdb/`ownOp` first; AirLabs gap-fill under `MAX_AIRLABS`; response includes `enrich` stats

## Hard invariants

- No third-party API secrets in front-end source or Pages-deployed JS
- Never display a flight missing carrier, destination, or plane type
- Free/trial data sources only unless user explicitly approves otherwise
- Personal access gate on the Worker (shared secret)
- Enrichment: hexdb/`ownOp` first; AirLabs only for incomplete rows within `MAX_AIRLABS`

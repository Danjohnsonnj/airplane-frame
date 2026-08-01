# Phase 4 plan — Diversity pack + minimal filters

**Status:** implemented pending UAT (code + runbooks; deploy when user asks)  
**Entry:** [HANDOFF.md](./HANDOFF.md) → this file  
**Prerequisites:** Phase 3 DONE (Pages UI + Worker live). Local: `worker/.dev.vars` with `APP_SHARED_SECRET` + `AIRLABS_API_KEY`. Production Worker already deployed. Branch: `main` (or feature branch off `main`).

## Decisions locked for this plan

| Topic | Choice |
|-------|--------|
| Pack size N | Worker default **5** (or fewer if not enough after filters); **no** UI N control this phase |
| Where pack + filters run | **Worker only** — returns curated pack; filters as query params |
| Carrier allow/deny | Optional comma-separated lists (name or ICAO substring, case-insensitive); **deny wins** if both match |
| Destination group | Named preset `nyc` = `{EWR,LGA,JFK}`; modes `prefer` \| `exclude` \| off (omit params) |
| Uniqueness | Pack prefers distinct **carrier** and distinct **destination** when filling slots; query `unique=1` (default) \| `0` |
| Airport-interest bias | Light interest score as **tie-break only** after diversity; boost when `origin` or `destination` is in `{EWR,LGA,JFK}` |
| Min altitude | Worker accepts optional `minAltitudeFt` (default `0`); UI sends its saved value so pack is not shrunk client-side |
| Cache | Cache **enriched candidates** by `lat/lon/radiusNm` only; apply filters + pack **after** cache hit/miss |

## Required reading (executor)

- [product-brief.md](./product-brief.md) — selection + filter locks
- [tech-brief.md](./tech-brief.md) — Worker response shape, front-end localStorage
- [lessons.md](./lessons.md) — secrets stay on Worker; Bearer is `APP_SHARED_SECRET`
- [phase-3.plan.md](./phase-3.plan.md) — shipped UI surface (settings, altitude, list)
- [deploy-worker.md](../../runbooks/deploy-worker.md) — `/flights` auth + local/prod verify

Do **not** need: spike rewrite; poster/visual work; changing data vendors.

## Out of scope

- User-selectable N (3–5) in settings — deferred
- Client-side packing or client-side carrier/dest filters
- Expanding destination presets beyond `nyc`
- Tuning default min-altitude from real traffic (open decision; leave default 5000)
- 1950s poster art / liveries
- Paid data tiers or new vendors
- Putting any third-party API secret in the Pages front end

## Goals

1. Worker returns ≤5 enriched flights for a JC pin, diversity-first with airport-interest tie-break.
2. Query filters (`carrierAllow`, `carrierDeny`, `destGroup`, `destGroupMode`, `unique`, `minAltitudeFt`) change the pack predictably.
3. Front end persists filter settings in `localStorage`, sends them on `/flights`, renders the pack (still guards required fields); status shows pack size.
4. Unit tests cover pack/filter pure logic; Worker + Pages smoke still work with Bearer auth.

## API contract (extend)

```
GET /flights?lat=&lon=&radiusMi=
  &minAltitudeFt=0          # optional; default 0
  &carrierAllow=            # optional; comma-separated
  &carrierDeny=             # optional; comma-separated; deny wins over allow
  &destGroup=nyc            # optional; only preset: nyc → EWR,LGA,JFK
  &destGroupMode=prefer|exclude   # required if destGroup set; omit both when off
  &unique=1                 # optional; default 1 (prefer unique carrier + destination)

Authorization: Bearer {APP_SHARED_SECRET}

→ 200 {
    pin, count, flights[],   # flights length ≤ PACK_SIZE (env default 5)
    cachedForSeconds,
    pack: { size, unique, destGroup, destGroupMode }  # echo applied pack settings
  }
→ 400 if destGroup set without valid destGroupMode, or unknown destGroup
→ 401 / 502 unchanged
```

Never return a flight missing `carrier`, `destination`, or `planeType`.

## Selection algorithm (Worker)

Operate on enriched candidates that already pass required fields (existing enrich path). Order:

1. **Altitude hard filter** — drop rows with `altitudeFt < minAltitudeFt` when `minAltitudeFt > 0`.
2. **Carrier hard filters** — if `carrierAllow` non-empty, keep only rows whose `carrier` matches any token (substring, case-insensitive); then remove any matching `carrierDeny`.
3. **Destination group hard filter** — if `destGroupMode=exclude` and `destGroup=nyc`, drop rows whose `destination` is in the preset (match IATA/ICAO case-insensitive; strip common prefixes if needed). `prefer` does **not** drop here.
4. **Diversity pack** — greedily fill up to `PACK_SIZE` (env `PACK_SIZE`, default 5):
   - If `destGroupMode=prefer` and `destGroup=nyc`: **first** fill seats using only metro-destination candidates (still applying uniqueness rules below); **then** fill any remaining seats from the full remaining pool. This is stronger than default airport-interest and is what makes `prefer` distinct from bias-only.
   - If `unique=1` (default): prefer candidates that add a new carrier **and** a new destination relative to the pack so far; if none, relax to new carrier **or** new destination; if none, take best remaining.
   - If `unique=0`: fill by interest score only (within the current fill pool).
5. **Interest score (tie-break)** — always on for JC-area ranking among equally diversity-eligible candidates: +2 if `destination` in metro set, +1 if `origin` in metro set, +0.1 × closer distance (invert `distanceNm` safely). Diversity / prefer-pool steps always outrank score.

Env: `PACK_SIZE` default 5 (replaces using `MAX_RESULTS` as the response cap for the pack; keep `MAX_ENRICH` / enrich slice as today; `MAX_RESULTS` may still cap candidates before pack, default ≥12).

## Cache behavior

- Cache key: `lat` + `lon` + `radiusNm` only (unchanged idea).
- Cached payload: enriched **candidate** list (pre-filter/pre-pack), plus pin metadata.
- On every authenticated request: read/build candidates → apply steps 1–5 → return packed body.
- Filter param changes must not miss the candidate cache or re-hit AirLabs within TTL.

## Files to add / change

| Path | Action |
|------|--------|
| `worker/src/pack.js` | **Add** — pure: parse filter tokens, metro preset, interest score, `selectPack(candidates, opts)` |
| `worker/test/pack.test.js` | **Add** — unit tests for allow/deny, exclude/prefer, unique packing, size ≤5 |
| `worker/src/auth.js` | **Update** — parse new query params; validate `destGroup` / `destGroupMode`; pass `minAltitudeFt` |
| `worker/test/auth.test.js` | **Update** — cover new query validation |
| `worker/src/index.js` | **Update** — cache candidates; call `selectPack`; echo `pack` in JSON; honor `PACK_SIZE` |
| `worker/wrangler.toml` | **Update** — add `PACK_SIZE = "5"` under `[vars]` (keep existing `MAX_ENRICH` / `MAX_RESULTS` / `CACHE_TTL_SECONDS`) |
| `js/lib.js` | **Update** — `buildFlightsUrl` accepts filter fields + `minAltitudeFt`; keep `filterFlights` only if still useful as guard, or stop altitude-filtering after Worker pack (prefer: **stop client altitude filter** once Worker receives `minAltitudeFt`) |
| `js/lib.test.js` | **Update** — URL builder includes new params |
| `js/config.js` | **Update** — `STORAGE_KEYS` + defaults for filters (`unique` default true; dest group off; allow/deny empty) |
| `js/app.js` | **Update** — load/save filter fields; pass into fetch URL; status copy for pack count |
| `index.html` / `css/app.css` | **Update** — settings: carrier allow, carrier deny, dest group (off/nyc+prefer/nyc+exclude), unique checkbox |
| `docs/runbooks/deploy-worker.md` | **Update** — document new query params + pack response |
| `docs/runbooks/pages.md` | **Update** — filter settings + UAT notes |
| Plan briefs | **Update on wrap-up** — HANDOFF → Phase 5; tech/product/phases/progress-log/lessons |

## Implementation steps

### 1. Pure pack module + tests

Add `worker/src/pack.js` with `NYC_METRO`, `matchesCarrierToken`, `selectPack`. No network I/O.

**Verify:** `cd worker && npm test` — new `pack.test.js` cases:

- deny removes matching carrier even if on allow list
- `exclude` + `nyc` drops EWR/LGA/JFK destinations
- `prefer` + `nyc` does not drop non-metro; metro wins ties when diversity equal
- with `unique=1`, pack of 5 from noisy list has no duplicate carrier when enough variety exists
- always `pack.length <= 5` and never includes incomplete rows

### 2. Query parsing

Extend `parseFlightsQuery` for the new params. Invalid `destGroup` or `destGroup` without `destGroupMode` → `{ error }`.

**Verify:** existing auth tests still pass; new cases for 400-shape errors and happy parse.

### 3. Wire Worker index + candidate cache

Refactor `/flights` so cache stores enriched candidates; after match or enrich, run altitude + `selectPack`, return packed JSON with `pack` echo. Default `PACK_SIZE=5`.

**Verify:**

```bash
cd worker && npm test
npx wrangler dev --ip 127.0.0.1 --port 8788
# with Bearer + JC pin:
# count ≤ 5; each flight has carrier, destination, planeType
# change carrierDeny to a visible carrier → that carrier gone on next request without waiting full TTL
```

### 4. Front-end filters + URL

Persist filter settings; extend `buildFlightsUrl`; send `minAltitudeFt`; **do not** re-apply client altitude filter on the pack (Worker already did). Keep `isCompleteFlight` guard when rendering.

**Verify:** `node --test js/lib.test.js`; local `python3 -m http.server` (or point `WORKER_BASE` at wrangler) → settings restore after reload; Refresh shows ≤5 cards; toggling unique / deny changes list.

### 5. Runbooks + deploy

Update deploy-worker + pages runbooks. Deploy Worker when user asks.

**Verify:** prod curl with Bearer → `count ≤ 5`; Pages (after push) shows pack; wrong secret still 401.

### 6. UAT smoke

- [ ] JC pin + default filters → 3–5 varied flights (carrier/dest diversity visible when traffic allows)
- [ ] Carrier deny removes that airline from pack
- [ ] Dest group exclude `nyc` removes EWR/LGA/JFK destinations
- [ ] Unique on vs off changes pack when duplicates would otherwise fill
- [ ] Two-device: same secret, independent localStorage filters OK
- [ ] Min altitude still respected (high value → fewer/empty without crash)

### 7. Session handoff (after UAT)

Overwrite tech-brief (pack + filter query contract); phases.md Phase 4 DONE; HANDOFF → Phase 5 next action; append progress-log; fold cache-then-pack lesson if useful. Commit only if user asks. Read [process.md](./process.md) before commit.

## Defaults

| Key | Default |
|-----|---------|
| `PACK_SIZE` (Worker env) | `5` |
| `unique` | `1` |
| `destGroup` / `destGroupMode` | off |
| `carrierAllow` / `carrierDeny` | empty |
| `minAltitudeFt` (query) | `0` on Worker; UI still defaults **5000** and sends it |
| Metro preset `nyc` | `EWR`, `LGA`, `JFK` |

## Open after Phase 4 (not blocking)

- User-selectable N 3–5
- Extra destination presets
- Tuned min-altitude default from real JC traffic
- Stronger airport-bias weights

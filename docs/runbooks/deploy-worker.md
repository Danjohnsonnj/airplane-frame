# Deploy Worker

Prerequisite: [cloudflare-signup.md](./cloudflare-signup.md), then [secrets.md](./secrets.md).

## Production URL (current)

| Item | Value |
|------|--------|
| Worker | `airplane-frame` |
| URL | **https://airplane-frame.danjohnsonnj.workers.dev** |
| Subdomain | `danjohnsonnj.workers.dev` |
| Config | `worker/wrangler.toml` (`workers_dev = true`) |

### Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/health` | none | `{ "ok": true }` |
| `GET` | `/flights?lat=&lon=&radiusMi=` | `Authorization: Bearer <APP_SHARED_SECRET>` | Diversity pack (≤`PACK_SIZE`, default 5). `radiusMi` is **statute miles** (converted to nm for airplanes.live). Optional filters below. |
| `OPTIONS` | `*` | none | CORS preflight |

#### `/flights` optional query params

| Param | Default | Notes |
|-------|---------|--------|
| `minAltitudeFt` | `0` | Hard filter before pack; UI sends its saved min altitude |
| `carrierAllow` | empty | Comma-separated name/ICAO substrings; if set, only matches |
| `carrierDeny` | empty | Comma-separated; **deny wins** over allow |
| `destGroup` | off | Only `nyc` (`EWR`,`LGA`,`JFK`); requires `destGroupMode` |
| `destGroupMode` | off | `prefer` (fill metro dests first) or `exclude` |
| `unique` | `1` | `1` prefer distinct carrier+destination; `0` score-only |

Response includes `count` (pack length), `candidateCount` (enriched pool before pack), `stale` (boolean), `ageSeconds` (when stale), `cachedForSeconds` (always `CACHE_TTL_SECONDS`), and `pack: { size, unique, destGroup, destGroupMode }`. Enriched **candidates** are cached in **Workers KV** (`FLIGHT_CACHE`) ~10 min fresh for non-empty (`CACHE_TTL_SECONDS`); empty results use a shorter fresh window (`EMPTY_CACHE_TTL_SECONDS`, 60s); filters re-pack without re-hitting AirLabs within TTL. On upstream failure or empty with a prior non-empty KV entry, returns **200** with `stale: true` and last good candidates.

### KV namespace (one-time)

```bash
cd worker
npx wrangler kv namespace create FLIGHT_CACHE
npx wrangler kv namespace create FLIGHT_CACHE --preview
# paste id + preview_id into wrangler.toml [[kv_namespaces]]
```

`STALE_TTL_SECONDS` (default 1800) controls KV entry expiry for stale fallback.

Pass bar: no/wrong Bearer → **401**; valid Bearer + JC pin → **200** with ≤5 flights each having `carrier`, `destination`, `planeType`.

## Local verify

```bash
cd worker
npm install
npm test
```

With Cloudflare login + `worker/.dev.vars`:

```bash
cd worker
npx wrangler dev --ip 127.0.0.1 --port 8788
```

(Use another `--port` if 8787/8788 is busy.)

```bash
BASE=http://127.0.0.1:8788
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/health"   # 200
curl -sS -o /dev/null -w "%{http_code}\n" \
  "$BASE/flights?lat=40.728&lon=-74.078&radiusMi=25"       # 401

curl -sS -H "Authorization: Bearer YOUR_SHARED_SECRET" \
  "$BASE/flights?lat=40.728&lon=-74.078&radiusMi=25" | head -c 1200
```

## Deploy / redeploy

```bash
cd worker
npx wrangler deploy
```

Ensure production secrets exist first ([secrets.md](./secrets.md)). Retest against the production URL:

```bash
BASE=https://airplane-frame.danjohnsonnj.workers.dev
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/health"   # 200
curl -sS -o /dev/null -w "%{http_code}\n" \
  "$BASE/flights?lat=40.728&lon=-74.078&radiusMi=25"       # 401
curl -sS -H "Authorization: Bearer YOUR_SHARED_SECRET" \
  "$BASE/flights?lat=40.728&lon=-74.078&radiusMi=25" | head -c 1200
```

### TLS / handshake failures right after first deploy

Fresh `*.workers.dev` URLs can briefly fail TLS (handshake alert, no peer cert). Confirm:

1. Email verified; subdomain registered (`yourname.workers.dev` visible in dashboard).
2. `workers_dev = true` in `wrangler.toml`, then `npx wrangler deploy` again.
3. Retry curl after a short wait.

See lessons.md: “Fresh workers.dev may briefly fail TLS”.

## Why a Worker

GitHub Pages cannot hold `AIRLABS_API_KEY`. Browser calls to many flight APIs also hit CORS. The Worker holds secrets, enriches server-side (airplanes.live + AirLabs, hexdb fallback), caches per lat/lon/radius bucket (10 min non-empty fresh, 60s empty fresh), and returns slim JSON.

Clients authenticate with **`APP_SHARED_SECRET`** only (see [secrets.md](./secrets.md)). Do not send the AirLabs key as the Bearer token.

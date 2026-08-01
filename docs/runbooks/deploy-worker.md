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
| `GET` | `/flights?lat=&lon=&radiusMi=` | `Authorization: Bearer <APP_SHARED_SECRET>` | Enriched flights; `radiusMi` is **statute miles** (converted to nm for airplanes.live) |
| `OPTIONS` | `*` | none | CORS preflight |

Pass bar: no/wrong Bearer → **401**; valid Bearer + JC pin → **200** with ≥3 flights each having `carrier`, `destination`, `planeType`.

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

GitHub Pages cannot hold `AIRLABS_API_KEY`. Browser calls to many flight APIs also hit CORS. The Worker holds secrets, enriches server-side (airplanes.live + AirLabs, hexdb fallback), caches ~5 minutes per lat/lon/radius bucket, and returns slim JSON.

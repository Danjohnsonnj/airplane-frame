# Local development (own IP)

Use this when testing on your machine so **airplanes.live** sees **your IP**, not Cloudflare’s shared egress (which often gets **429**).

GitHub Pages always uses the **production** Worker. Local preview at `127.0.0.1:8080` auto-routes to local Wrangler on `:8788`.

## Prerequisites

1. [secrets.md](./secrets.md) — `worker/.dev.vars` with `APP_SHARED_SECRET` + `AIRLABS_API_KEY`
2. Cloudflare login: `cd worker && npx wrangler whoami`
3. Ports **8080** and **8788** free

## Cold-start (two terminals)

**Terminal 1 — static UI**

```bash
./scripts/dev-pages.sh
# http://127.0.0.1:8080/
```

**Terminal 2 — Worker**

```bash
./scripts/dev-worker.sh
# http://127.0.0.1:8788/health → { "ok": true }
```

## First load

1. Open **http://127.0.0.1:8080/**
2. Paste **`APP_SHARED_SECRET`** from `worker/.dev.vars` (not `AIRLABS_API_KEY`)
3. **Save settings** → **Refresh flights**
4. Status should end with **`· local Worker`** and show pack + total flights

## Overrides

| URL | Worker used |
|-----|-------------|
| `http://127.0.0.1:8080/` | Local `:8788` (your IP) |
| `http://127.0.0.1:8080/?worker=prod` | Production `workers.dev` |

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `Network error` / connection refused | `dev-worker.sh` not running |
| `401 Unauthorized` | Wrong secret pasted (AirLabs key vs `APP_SHARED_SECRET`) |
| `502` / upstream 429 on **production** | Shared Cloudflare IP — wait, use KV cache, or test locally |
| `502` on **local** | airplanes.live rate limit on your IP — wait ~1s between refreshes |

## Tests

```bash
node --test js/lib.test.js
cd worker && npm test
```

## Production path

Deploy and Pages UAT: [deploy-worker.md](./deploy-worker.md), [pages.md](./pages.md).

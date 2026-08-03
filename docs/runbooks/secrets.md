# Worker secrets

Secrets never go in git.

| Environment | Where |
|-------------|--------|
| Local `wrangler dev` | `worker/.dev.vars` (gitignored) |
| Pi production API | `/etc/airplane-frame/worker.env` (`root:root` mode `600`) — see [pi-worker.md](./pi-worker.md) |
| Legacy Cloudflare Worker | Cloudflare secrets via Wrangler |
| Spike script only | `spike/.env` (gitignored) — AirLabs key can be copied into `.dev.vars` |
| Browser / GitHub Pages | **Only** `APP_SHARED_SECRET` in `localStorage` — never `AIRLABS_API_KEY` |

## Which secret goes where

| Name | Worker | Front end (Pages / local UI) |
|------|--------|------------------------------|
| `APP_SHARED_SECRET` | Yes — compared to `Authorization: Bearer …` | Yes — paste into the **APP_SHARED_SECRET** field (`worker/.dev.vars` / Wrangler) |
| `AIRLABS_API_KEY` | Yes — Worker calls AirLabs | **No** — never paste into the browser; a 401 usually means you used this by mistake |

They are unrelated values. Using the AirLabs key as the Bearer token always returns **401**.

## Required secrets

| Name | Purpose |
|------|---------|
| `APP_SHARED_SECRET` | Personal access gate; clients send `Authorization: Bearer <this>` |
| `AIRLABS_API_KEY` | AirLabs flight enrichment (Worker-only) |

Non-secret config lives in `worker/wrangler.toml` (`CACHE_TTL_SECONDS`, `STALE_TTL_SECONDS`, `EMPTY_CACHE_TTL_SECONDS`, `CALLSIGN_CACHE_TTL_SECONDS`, `CALLSIGN_NEG_ADSBDB_TTL_SECONDS`, `CALLSIGN_NEG_AIRLABS_TTL_SECONDS`, `MAX_ATTEMPT`, `MAX_AIRLABS`, `MAX_RESULTS`, `PACK_SIZE`). Pi `worker.env` should match (see `worker/.pi.env.example`; legacy `MAX_ENRICH` still accepted as `MAX_ATTEMPT` fallback).

Local `wrangler dev` reads the same `APP_SHARED_SECRET` as production unless you rotate them separately.

## Local (wrangler dev)

```bash
cp worker/.dev.vars.example worker/.dev.vars
```

Edit `worker/.dev.vars`:

1. Set `AIRLABS_API_KEY` (same value as in `spike/.env` if you already spiked).
2. Set `APP_SHARED_SECRET` to a long random value:

```bash
openssl rand -hex 32
```

Confirm both `worker/.dev.vars` and `spike/.env` stay untracked (`git status`).

**Never** put real keys in `worker/.dev.vars.example` or `spike/.env.example`.

## Pi production (`api.danjnj.com`)

On the Pi only — copy `worker/.pi.env.example` to `/etc/airplane-frame/worker.env`, fill `AIRLABS_API_KEY` and `APP_SHARED_SECRET`, keep `HOST=127.0.0.1` / `PORT=8788` / `FLIGHT_CACHE_PATH=/var/lib/airplane-frame/cache.json`.

```bash
sudo chown root:root /etc/airplane-frame/worker.env
sudo chmod 600 /etc/airplane-frame/worker.env
```

Use the **same** `APP_SHARED_SECRET` the browser already stores (or rotate everywhere together). Never commit `worker.env` or put AirLabs keys in Pages. Ops: [pi-worker.md](./pi-worker.md).

## Legacy Cloudflare Worker production

After [cloudflare-signup.md](./cloudflare-signup.md) (rollback path `?worker=cloudflare`):

```bash
cd worker
# interactive (paste when prompted — not into chat)
npx wrangler secret put APP_SHARED_SECRET
npx wrangler secret put AIRLABS_API_KEY

# or bulk from a temp JSON file you delete immediately:
# {"APP_SHARED_SECRET":"…","AIRLABS_API_KEY":"…"}
# npx wrangler secret bulk /tmp/airplane-frame-secrets.json && rm /tmp/airplane-frame-secrets.json
```

Then deploy (see [deploy-worker.md](./deploy-worker.md)). Secrets uploaded before the first script deploy may create an empty Worker shell; always follow with `npx wrangler deploy`.

## Front-end entry (Pages / local)

1. Open the site ([pages.md](./pages.md)).
2. Paste **`APP_SHARED_SECRET`** from `worker/.dev.vars` (or the Wrangler production secret) into the field labeled **APP_SHARED_SECRET**.
3. Save settings / Refresh. On success, the value is stored in `localStorage` (`af_secret`) on that browser only.
4. On **401**, the UI clears the stored secret, pauses auto-refresh, and reminds you not to use `AIRLABS_API_KEY`.

## Rotate shared secret

1. Generate a new secret (`openssl rand -hex 32`).
2. Update local `.dev.vars`, Pi `/etc/airplane-frame/worker.env`, and legacy Wrangler (`wrangler secret put APP_SHARED_SECRET`) as needed.
3. Restart Pi worker: `sudo systemctl restart airplane-frame-worker.service`.
4. Update every client (localStorage / tester devices).
5. Old secret stops working immediately.

Rotating `AIRLABS_API_KEY` is separate (AirLabs dashboard + Pi `worker.env` / Wrangler only; front end unchanged).

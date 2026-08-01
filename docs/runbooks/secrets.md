# Worker secrets

Secrets never go in git.

| Environment | Where |
|-------------|--------|
| Local `wrangler dev` | `worker/.dev.vars` (gitignored) |
| Production | Cloudflare secrets via Wrangler |
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

Non-secret config lives in `worker/wrangler.toml` (`CACHE_TTL_SECONDS`, `MAX_ENRICH`, `MAX_RESULTS`).

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

## Production

After [cloudflare-signup.md](./cloudflare-signup.md):

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
2. Update local `.dev.vars` and production (`wrangler secret put APP_SHARED_SECRET`).
3. Update every client (localStorage / tester devices).
4. Old secret stops working immediately.

Rotating `AIRLABS_API_KEY` is separate (AirLabs dashboard + Worker secret only; front end unchanged).

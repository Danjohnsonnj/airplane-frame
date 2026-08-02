# GitHub Pages (front end)

The Phase 3 UI is static files at the **repo root**: `index.html`, `css/`, `js/`.

## Enable Pages

1. Push `main` with the root site files.
2. GitHub → **Settings** → **Pages**.
3. **Build and deployment** → Source: **Deploy from a branch**.
4. Branch: `main` / folder: `/ (root)` → Save.
5. Wait for the site URL: **[https://danjohnsonnj.github.io/airplane-frame/](https://danjohnsonnj.github.io/airplane-frame/)** (project site).

HTTPS only. The Worker already allows browser CORS (`Access-Control-Allow-Origin: *`).

**Configured (2026-07-31 via** `gh`**):** source `main` / `/`, HTTPS enforced, status `built`. Repo homepage set to the Pages URL.

## Local preview

**Recommended:** two terminals — see [local-dev.md](./local-dev.md).

```bash
./scripts/dev-pages.sh    # http://127.0.0.1:8080/
./scripts/dev-worker.sh   # http://127.0.0.1:8788/
```

On `127.0.0.1` or a LAN IP (`192.168.x.x`, etc.), the UI auto-targets local Wrangler (your IP for airplanes.live). Overrides:

| Query | Backend |
|-------|---------|
| (none, on github.io) | `https://api.danjnj.com` (Pi Tunnel — Phase 6.5) |
| `?worker=prod` | Same Pi tunnel API (force from localhost) |
| `?worker=cloudflare` | Legacy `workers.dev` Worker (explicit rollback; shared egress) |

LAN access: [local-dev.md](./local-dev.md#same-wi-fi-phone--tablet).

Manual alternative:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
cd worker && npx wrangler dev --ip 0.0.0.0 --port 8788
```

## Auth: APP_SHARED_SECRET only

The UI field **APP_SHARED_SECRET** must match the Worker’s `APP_SHARED_SECRET` (`worker/.dev.vars` / Wrangler).

| Paste this          | Do not paste this                               |
| ------------------- | ----------------------------------------------- |
| `APP_SHARED_SECRET` | `AIRLABS_API_KEY` (Worker-only; causes **401**) |

Full table: [secrets.md](./secrets.md).

1. Open the Pages (or local) URL.
2. Paste `APP_SHARED_SECRET` into the labeled field.
3. **Save settings**, then **Refresh flights**. On **200**, the secret is kept in `localStorage` (`af_secret`) on that browser only.
4. On **401**, the app removes the stored secret, pauses auto-refresh, and shows a hint that the AirLabs key is the wrong value.

Never commit secrets. Never put `AIRLABS_API_KEY` in front-end source or the browser field.

## Filters (Phase 4)

Settings persisted in `localStorage` and sent as Worker query params:

| UI control                     | Behavior                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| Carrier allow / deny           | Comma-separated; deny wins                                       |
| Destination group              | Off / NYC prefer / NYC exclude                                   |
| Unique carriers & destinations | Default on                                                       |
| Min altitude                   | Sent to Worker (`minAltitudeFt`); pack already altitude-filtered |

Worker returns ≤5 flights (`PACK_SIZE`). Status line shows pack size, candidate total, stale age (if any), and backend (`local Worker` vs `production API (Pi)` vs `Cloudflare Worker (rollback)`).

## UAT checklist (Phase 4 pack + filters)

- [x] JC pin + defaults → ≤5 varied flights (carrier/dest diversity when traffic allows)
- [x] Carrier deny removes that airline from the pack
- [x] Dest group exclude NYC removes EWR/LGA/JFK destinations
- [x] Unique on vs off changes the pack when duplicates would otherwise fill
- [x] Two devices: same secret, independent filter localStorage OK
- [x] High min altitude → fewer/empty without crash; wrong secret → 401

**Result:** PASS 2026-07-31 (user confirmed Phase 4 UAT).

## Front-end unit tests

```bash
node --test js/lib.test.js
```

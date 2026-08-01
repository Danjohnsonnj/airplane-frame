# airplane-frame

Personal web app: nearby commercial flights (carrier, destination, plane type) around a saved pin. Starts with Jersey City, NJ.

## Live pieces

| Piece | URL / path |
|-------|------------|
| Front end (GitHub Pages) | Enable Pages from `master` / root — see [docs/runbooks/pages.md](docs/runbooks/pages.md) |
| Worker BFF | https://airplane-frame.danjohnsonnj.workers.dev |

## Local preview

```bash
# from repo root
python3 -m http.server 8080
# open http://127.0.0.1:8080/
```

Enter **`APP_SHARED_SECRET`** from `worker/.dev.vars` (Wrangler secret) — **not** `AIRLABS_API_KEY`. Details: [docs/runbooks/secrets.md](docs/runbooks/secrets.md). Stored only in browser `localStorage`; never commit it.

```bash
node --test js/lib.test.js
cd worker && npm test
```

## Ops

- [docs/runbooks/](docs/runbooks/) — Cloudflare, secrets, deploy, Pages
- [docs/plans/airplane-frame/HANDOFF.md](docs/plans/airplane-frame/HANDOFF.md) — current phase
- `.cursor/skills/airplane-frame-ops` — agent entry to runbooks

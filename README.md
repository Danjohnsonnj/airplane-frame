# airplane-frame

Personal web app: nearby commercial flights (carrier, destination, plane type) around a saved pin. Starts with Jersey City, NJ.

## Live pieces

| Piece | URL / path |
|-------|------------|
| Front end (GitHub Pages) | https://danjohnsonnj.github.io/airplane-frame/ — see [docs/runbooks/pages.md](docs/runbooks/pages.md) |
| Production API (target) | `https://api.danjnj.com` (Cloudflare Tunnel → Pi; Phase 6.5) |
| Legacy Worker (rollback) | https://airplane-frame.danjohnsonnj.workers.dev — `?worker=cloudflare` |

**Production note:** API is the Pi via Cloudflare Tunnel (`api.danjnj.com`). `?worker=cloudflare` hits `workers.dev`, which returns 502 because adsb.fi blocks that address (2026-10-24). Do not switch Pages to it. Ops/reboot: [docs/runbooks/pi-worker.md](docs/runbooks/pi-worker.md). Status: [HANDOFF.md](docs/plans/airplane-frame/HANDOFF.md).

## Local testing (own IP)

adsb.fi opendata rate-limits (~1 req/s). Local preview uses Wrangler on your machine; production Pages still targets the Pi tunnel until `js/config.js` is updated and pushed.

```bash
./scripts/dev-pages.sh    # terminal 1 — http://127.0.0.1:8080/
./scripts/dev-worker.sh   # terminal 2 — http://127.0.0.1:8788/
```

Full checklist: [docs/runbooks/local-dev.md](docs/runbooks/local-dev.md). Same-Wi‑Fi devices can use the **LAN** URL printed when scripts start. Overrides: `?worker=prod` → Pi API; `?worker=cloudflare` → legacy Worker.

Enter **`APP_SHARED_SECRET`** from `worker/.dev.vars` — **not** `AIRLABS_API_KEY`. Details: [docs/runbooks/secrets.md](docs/runbooks/secrets.md).

```bash
node --test js/lib.test.js
cd worker && npm test
```

## Ops

- [docs/runbooks/](docs/runbooks/) — Cloudflare, secrets, Pages, local dev
- [docs/runbooks/pi-worker.md](docs/runbooks/pi-worker.md) — Pi Node API, systemd, sync, Tunnel
- [docs/plans/airplane-frame/HANDOFF.md](docs/plans/airplane-frame/HANDOFF.md) — current phase
- `.cursor/skills/airplane-frame-ops` — agent entry to runbooks

## Docs

Canonical hub (settled + in progress): [docs/index.md](docs/index.md). Agents start at [AGENTS.md](AGENTS.md).

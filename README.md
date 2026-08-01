# airplane-frame

Personal web app: nearby commercial flights (carrier, destination, plane type) around a saved pin. Starts with Jersey City, NJ.

## Live pieces

| Piece | URL / path |
|-------|------------|
| Front end (GitHub Pages) | https://danjohnsonnj.github.io/airplane-frame/ — see [docs/runbooks/pages.md](docs/runbooks/pages.md) |
| Worker BFF | https://airplane-frame.danjohnsonnj.workers.dev |

## Local testing (own IP)

airplanes.live rate-limits by IP. Local preview uses **your** IP via Wrangler, not Cloudflare’s shared egress.

```bash
./scripts/dev-pages.sh    # terminal 1 — http://127.0.0.1:8080/
./scripts/dev-worker.sh   # terminal 2 — http://127.0.0.1:8788/
```

Full checklist: [docs/runbooks/local-dev.md](docs/runbooks/local-dev.md). Add `?worker=prod` on localhost to test against production Worker.

Enter **`APP_SHARED_SECRET`** from `worker/.dev.vars` — **not** `AIRLABS_API_KEY`. Details: [docs/runbooks/secrets.md](docs/runbooks/secrets.md).

```bash
node --test js/lib.test.js
cd worker && npm test
```

## Ops

- [docs/runbooks/](docs/runbooks/) — Cloudflare, secrets, deploy, Pages, local dev
- [docs/plans/airplane-frame/HANDOFF.md](docs/plans/airplane-frame/HANDOFF.md) — current phase
- `.cursor/skills/airplane-frame-ops` — agent entry to runbooks

# airplane-frame

Personal web app: nearby commercial flights (carrier, destination, plane type) around a saved pin.

Canonical docs: [docs/index.md](docs/index.md). Resume: [docs/plans/airplane-frame/HANDOFF.md](docs/plans/airplane-frame/HANDOFF.md).

## Commands

```bash
./scripts/dev-pages.sh
./scripts/dev-worker.sh
node --test js/lib.test.js
cd worker && npm test
node docs/design-mocks/gen-carrier-css.mjs
```

Ops procedures: `.cursor/skills/airplane-frame-ops` then [docs/runbooks/](docs/runbooks/).

## Stack

GitHub Pages (repo-root static) · production API `api.danjnj.com` (Pi tunnel, home IP) · positions on this branch: adsb.fi → adsbdb → AirLabs. Do not send Pages at `workers.dev`: adsb.fi returns HTTP 403 from Cloudflare (2026-10-24). Pi SSH is `ssh mypi.local`, not `192.168.1.46`.

---
name: airplane-frame-ops
description: >-
  Operate and maintain the airplane-frame Pages + Worker stack: deploy, secrets,
  API incidents, Phase handoff, and local preview. Use when deploying the Worker,
  rotating secrets, debugging flight enrichment, starting local Wrangler/Pages,
  or when the user mentions runbooks, wrangler, AirLabs, or airplane-frame ops.
---

# airplane-frame ops

## Source of truth

Do **not** duplicate long procedures here. Read and follow:

- `docs/runbooks/README.md` — runbook index
- `docs/runbooks/local-dev.md` — local Pages + Wrangler (own IP)
- `docs/runbooks/cloudflare-signup.md`
- `docs/runbooks/secrets.md`
- `docs/runbooks/deploy-worker.md` — legacy Cloudflare Worker
- `docs/runbooks/pi-worker.md` — Pi Node API, systemd, sync, Tunnel
- `docs/runbooks/pages.md` — GitHub Pages + front-end UAT
- `spike/README.md` / `spike/CREDENTIALS.md` — data APIs
- `docs/plans/airplane-frame/HANDOFF.md` — current phase / next action
- Root `README.md` — local preview + Pages pointer
- `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md` — Phase 6.5 Pi API + Tunnel (`api.danjnj.com`)

## Hard rules

- Never commit secrets or paste them into chat.
- Never put API keys (`AIRLABS_API_KEY`, etc.) in the GitHub Pages front end.
- Front-end Bearer token is **`APP_SHARED_SECRET` only** — not the AirLabs key (see `docs/runbooks/secrets.md`).
- Only return / display flights that include carrier, destination, and planeType.
- Locked data stack: airplanes.live + AirLabs (hexdb fallback).

## Local stack (agent-run)

When the user wants local preview or local UAT, **you** start the servers — follow **Agent: start local stack** in `docs/runbooks/local-dev.md` (do not duplicate steps here). First-load secret paste stays with the user.

## Live endpoints

- Target production API: `https://api.danjnj.com` (Tunnel → Pi; pending cutover)
- Legacy Cloudflare Worker rollback: `https://airplane-frame.danjohnsonnj.workers.dev` (`?worker=cloudflare`)
- Local Worker: `http://127.0.0.1:8788` (when `scripts/dev-worker.sh` / `npm run start:pi` is running)
- Preferred reliable path today: local / LAN Wrangler or Pi adapter (own IP). Cursor on macOS may need Terminal.app for LAN SSH (Local Network plist gap).
- `GET /health` (no auth)
- `GET /flights?lat=&lon=&radiusMi=` with `Authorization: Bearer <APP_SHARED_SECRET>`

## Quick checks

```bash
cd worker && npm test
node --test js/lib.test.js
./scripts/dev-pages.sh    # terminal 1
./scripts/dev-worker.sh   # terminal 2 — see local-dev.md
# curls: see docs/runbooks/deploy-worker.md
```

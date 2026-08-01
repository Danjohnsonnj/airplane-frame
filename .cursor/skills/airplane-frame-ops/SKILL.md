---
name: airplane-frame-ops
description: >-
  Operate and maintain the airplane-frame Pages + Worker stack: deploy, secrets,
  API incidents, and Phase handoff. Use when deploying the Worker, rotating
  secrets, debugging flight enrichment, or when the user mentions runbooks,
  wrangler, AirLabs, or airplane-frame ops.
---

# airplane-frame ops

## Source of truth

Do **not** duplicate long procedures here. Read and follow:

- `docs/runbooks/README.md` — runbook index
- `docs/runbooks/cloudflare-signup.md`
- `docs/runbooks/secrets.md`
- `docs/runbooks/deploy-worker.md`
- `spike/README.md` / `spike/CREDENTIALS.md` — data APIs
- `docs/plans/airplane-frame/HANDOFF.md` — current phase / next action

## Hard rules

- Never commit secrets or paste them into chat.
- Never put API keys in the GitHub Pages front end.
- Only return / display flights that include carrier, destination, and planeType.
- Locked data stack: airplanes.live + AirLabs (hexdb fallback).

## Live endpoints

- Production: `https://airplane-frame.danjohnsonnj.workers.dev`
- `GET /health` (no auth)
- `GET /flights?lat=&lon=&radiusMi=` with `Authorization: Bearer <APP_SHARED_SECRET>`

## Quick checks

```bash
cd worker && npm test
cd worker && npx wrangler dev --ip 127.0.0.1 --port 8788
# curls: see docs/runbooks/deploy-worker.md
```

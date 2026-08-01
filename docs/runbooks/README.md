# Runbooks

Operational how-tos for airplane-frame. Agents: start at `.cursor/skills/airplane-frame-ops/SKILL.md`, then these files.

| Runbook | When |
|---------|------|
| [cloudflare-signup.md](./cloudflare-signup.md) | New machine / new Cloudflare account; Wrangler login |
| [secrets.md](./secrets.md) | Local `.dev.vars`, production secrets, rotation |
| [deploy-worker.md](./deploy-worker.md) | Test, deploy, and curl-verify the Worker |
| [local-dev.md](./local-dev.md) | Local Pages + Wrangler (own IP); **agents start the stack** for the user |
| [pages.md](./pages.md) | GitHub Pages enable, local preview, front-end UAT |

**Production Worker (Phase 2):** `https://airplane-frame.danjohnsonnj.workers.dev`  
**GitHub Pages (Phase 3):** `https://danjohnsonnj.github.io/airplane-frame/`  
**Account workers.dev subdomain:** `danjohnsonnj.workers.dev`

Related: `spike/CREDENTIALS.md` (AirLabs / data APIs), `docs/plans/airplane-frame/HANDOFF.md` (current phase), root `README.md` (site entry).

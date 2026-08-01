# Runbooks

Operational how-tos for airplane-frame. Agents: start at `.cursor/skills/airplane-frame-ops/SKILL.md`, then these files.

| Runbook | When |
|---------|------|
| [cloudflare-signup.md](./cloudflare-signup.md) | New machine / new Cloudflare account; Wrangler login |
| [secrets.md](./secrets.md) | Local `.dev.vars`, production secrets, rotation |
| [deploy-worker.md](./deploy-worker.md) | Test, deploy, and curl-verify the Worker |

**Production Worker (Phase 2):** `https://airplane-frame.danjohnsonnj.workers.dev`  
**Account workers.dev subdomain:** `danjohnsonnj.workers.dev`

Related: `spike/CREDENTIALS.md` (AirLabs / data APIs), `docs/plans/airplane-frame/HANDOFF.md` (current phase).

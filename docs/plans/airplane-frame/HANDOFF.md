# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 6.5 — Pi-hosted Worker + Cloudflare Tunnel (egress)

**Next action (cold-start executable):**

1. Read required reading below (especially the plan Progress section).
2. Stay on branch `feature/pi-node-adapter`. **Do not merge to `main` yet** — Pages now defaults to `https://api.danjnj.com`, which is not live until Tunnel + Pi are up. After merge, use `?worker=cloudflare` only as an explicit temporary bridge.
3. Implement **plan slice 4**: `scripts/pi-sync-main.sh` + `docs/runbooks/pi-worker.md` (+ index/secrets/README pointers) per `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md`.
4. User path (parallel / after slice 4): install Node ≥18 on Pi `mypi`; create Tunnel hostname `api.danjnj.com` → `http://127.0.0.1:8788` when Cloudflare zone is **Active**; secrets + systemd.
5. Phase 6 poster UAT stays paused until production data is reliable.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (this phase):**

- tech-brief.md — topology, egress blocker, target `api.danjnj.com`
- lessons.md — airplanes.live 429; Cloudflare grey-cloud SSL; Cursor LAN block
- docs/runbooks/local-dev.md — own-IP local/LAN preview
- docs/runbooks/pages.md — Pages URL selection + `?worker=cloudflare` / `?worker=prod`
- docs/runbooks/secrets.md — secret boundaries (Pi holds keys; Pages never does)
- process.md — how we work (read before committing)
- `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md` — full plan (Progress + slices 4–8)

**Index (load on demand):**

- product-brief.md — background, goals, rationale, non-goals, boundaries
- tech-brief.md — current vs proposed architecture, verified findings
- phases.md — phases + per-phase verify steps
- progress-log.md — dated history of decisions/learnings/overwrites
- lessons.md — curated, accreted toolkit
- phase-3.plan.md / phase-4.plan.md / phase-4.5.plan.md / phase-6.plan.md / carrier-brand-alias.plan.md — phase plans
- visual-direction.md / carrier-brand-alias.plan.md — resume Phase 6 UAT after egress is fixed
- docs/runbooks/README.md — ops runbook index
- spike/README.md — Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md — agent entry to runbooks

**Key facts (resume without re-discovery):**

| Fact | Value |
|------|--------|
| Branch | `feature/pi-node-adapter` (slices 1–2: `379e268`; slice 3: this commit) |
| Target API | `https://api.danjnj.com` (`PROD_API_BASE` in `js/config.js`) |
| Rollback | `?worker=cloudflare` → `https://airplane-frame.danjohnsonnj.workers.dev` |
| Cloudflare zone | `danjnj.com` (Free); NS `amy`/`shane.ns.cloudflare.com`; Squarespace `www` = **DNS only** |
| Pi | `mypi` / `192.168.1.46` (Wi‑Fi); eth MAC `B8:27:EB:7C:EE:0F`; Wi‑Fi MAC `B8:27:EB:29:BB:5A` |
| Pi SSH | `ssh pi@192.168.1.46` from **Terminal.app** (Cursor LAN often blocked — missing Local Network plist) |
| Pi software | git 2.47.3; **Node not installed** yet |
| Adapter | `worker/src/node/` — `npm run start:pi`; tests: `cd worker && npm test` |

**Verify before coding:**

```bash
git branch --show-current   # expect feature/pi-node-adapter
node --test js/lib.test.js
cd worker && npm test
```

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic; settings tag-chip chrome explore later.

**Open items:** **Blocker:** production airplanes.live 429 via shared Worker egress. Zone may still show Pending→**Active** in Cloudflare UI. Tunnel/`api` hostname not created. Pi Node + systemd not installed. Phase 6 UAT deferred. Settings period polish, geocoder polish, livery source deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md). DNS reverse to Squarespace: see agent memory / progress-log 2026-08-02.

**Last updated:** 2026-08-02 — slices 1–3 done; next = Slice 4 Pi runbooks; do not merge Pages routing until Tunnel live

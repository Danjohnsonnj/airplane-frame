# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 6.5 — Pi-hosted Worker + Cloudflare Tunnel (egress)

**Next action (cold-start executable):**

1. Read required reading below (especially the plan Progress section + parallel-work gate).
2. Stay on branch `feature/pi-node-adapter`. **Do not merge to `main` yet** — Pages defaults to `https://api.danjnj.com`; Tunnel not live. After merge, `?worker=cloudflare` is the temporary bridge only.
3. **Slice 4 done** (pushed on this branch): `scripts/pi-sync-main.sh`, `docs/runbooks/pi-worker.md`, pointers. Verify: `./scripts/pi-sync-main.test.sh`.
4. **User path (in order):** Slice 6 steps 1–7 (Node, deploy key, clone `feature/pi-node-adapter`, `worker.env`, optional manual `/health`) → Slice 7 Tunnel (`api.danjnj.com` → `http://127.0.0.1:8788`) → Slice 6 step 8 (systemd units + sync timer from `pi-worker.md`).
5. **Gated (agent Slice 8 / merge):** wait until push is done and user finishes steps 4 above. Phase 6 poster UAT stays paused until production data is reliable.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (this phase):**

- tech-brief.md — topology, egress blocker, target `api.danjnj.com`
- lessons.md — airplanes.live 429; Cloudflare grey-cloud SSL; Cursor LAN block
- docs/runbooks/local-dev.md — own-IP local/LAN preview
- docs/runbooks/pages.md — Pages URL selection + `?worker=cloudflare` / `?worker=prod`
- docs/runbooks/secrets.md — secret boundaries (Pi holds keys; Pages never does)
- docs/runbooks/pi-worker.md — Pi layout, systemd units, sync script, Tunnel
- process.md — how we work (read before committing)
- `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md` — full plan (Progress + slices 5–8 done/in progress)

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
| Branch | `feature/pi-node-adapter` (1–2: `379e268`; 3: `c10f5b9`; 4: this commit) |
| Target API | `https://api.danjnj.com` (`PROD_API_BASE` in `js/config.js`) |
| Rollback | `?worker=cloudflare` → `https://airplane-frame.danjohnsonnj.workers.dev` |
| Cloudflare zone | `danjnj.com` **Active** (Free); NS `amy`/`shane.ns.cloudflare.com`; Squarespace `www` = **DNS only** |
| Pi | `mypi` / `192.168.1.46` (Wi‑Fi); eth MAC `B8:27:EB:7C:EE:0F`; Wi‑Fi MAC `B8:27:EB:29:BB:5A` |
| Pi SSH | `ssh pi@192.168.1.46` from **Terminal.app** (Cursor LAN often blocked — missing Local Network plist) |
| Pi software | git 2.47.3; **Node not installed** yet (Slice 6 in progress) |
| Adapter | `worker/src/node/` — `npm run start:pi`; tests: `cd worker && npm test` |

**Verify before coding:**

```bash
git branch --show-current   # expect feature/pi-node-adapter
node --test js/lib.test.js
cd worker && npm test
```

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic; settings tag-chip chrome explore later.

**Open items:** **Blocker:** production airplanes.live 429 via shared Worker egress. Zone **Active**; Tunnel/`api` hostname not created. User: Slice 6 (1–7) → Slice 7 → Slice 6.8 (systemd). Slice 8/merge gated. Phase 6 UAT deferred. Settings period polish, geocoder polish, livery source deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md). DNS reverse to Squarespace: see agent memory / progress-log 2026-08-02.

**Last updated:** 2026-08-02 — Slice 4 committed/pushed; user owns 6→7→6.8; Slice 8 gated

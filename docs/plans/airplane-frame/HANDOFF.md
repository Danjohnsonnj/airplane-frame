# airplane-frame - Handoff

**Goal:** Personal web app showing up to **10** nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Enrich efficiency + pack size — **code + local UAT DONE**; Pi env/sync pending push to `main`. Phase 6.5 Pi Tunnel **DONE**. Phase 6 poster polish **deferred**.

**Next action (cold-start executable):**

1. Read process.md (before any commit).
2. Commit + push enrich-efficiency changes to `main` (when user asks).
3. On Pi (Terminal.app): sync `main`, set `MAX_ATTEMPT=36` `MAX_AIRLABS=5` `PACK_SIZE=10` in `/etc/airplane-frame/worker.env` (remove `MAX_ENRICH`), clear cache, restart worker, public smoke against `https://api.danjnj.com` — steps in `~/.cursor/plans/enrich_efficiency_pool_355002fc.plan.md` §5 and [pi-worker.md](../../runbooks/pi-worker.md).
4. **Deferred (do not start unless asked):** Phase 6 poster UAT/polish (visual-direction.md, carrier-brand-alias). Pi reboot/move checklist remains in docs/runbooks/pi-worker.md.
5. Production site: https://danjohnsonnj.github.io/airplane-frame/ → API `https://api.danjnj.com`.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (this phase):**

- process.md — before committing
- docs/runbooks/pi-worker.md — sync + restart after `main` lands
- docs/runbooks/secrets.md — Pi `worker.env` env names
- `~/.cursor/plans/enrich_efficiency_pool_355002fc.plan.md` — §5 Pi UAT

**Index (load on demand):**

- tech-brief.md — pipeline current truth (hexdb-first + caps)
- lessons.md — cache-by-pin + hexdb-first note
- product-brief.md — background (may still say 3–5 historically)
- phases.md — phase status (6.5 DONE; Phase 6 polish deferred)
- progress-log.md — dated history
- docs/runbooks/local-dev.md / pages.md / deploy-worker.md
- phase-6.plan.md / carrier-brand-alias.plan.md / visual-direction.md — deferred poster polish
- spike/README.md — Phase 1 spike
- .cursor/skills/airplane-frame-ops/SKILL.md — agent entry to runbooks

**Key facts (resume without re-discovery):**

| Fact | Value |
|------|--------|
| Branch | `main` (Pi checkout: `/opt/airplane-frame` on `main`) |
| Target API | `https://api.danjnj.com` |
| Rollback | `?worker=cloudflare` → `workers.dev` (often EMPTY/429 — expected) |
| Cloudflare zone | `danjnj.com` **Active**; Squarespace `www` = **DNS only** |
| Tunnel | `airplane-frame-pi`; `api.danjnj.com` → `http://127.0.0.1:8788`; CNAME → `3f42e0bf-6401-421d-8f4f-fc6d14201893.cfargotunnel.com` |
| Pi | `mypi` / `192.168.1.46` (Wi‑Fi); **arm64**; eth MAC `B8:27:EB:7C:EE:0F`; Wi‑Fi MAC `B8:27:EB:29:BB:5A` |
| Pi SSH | `ssh pi@192.168.1.46` from **Terminal.app** (Cursor LAN often blocked) |
| Boot services | `airplane-frame-worker.service`, `airplane-frame-sync.timer`, `cloudflared` — must be **enabled** |
| Secrets | `/etc/airplane-frame/worker.env` root:root mode 600 |
| Adapter | `worker/src/node/` — `npm run start:pi` |
| Env (shipped defaults) | `MAX_ATTEMPT=36`, `MAX_AIRLABS=5`, `PACK_SIZE=10`, `MAX_RESULTS=20` |

**Verify before coding:**

```bash
git branch --show-current   # expect main
node --test js/lib.test.js
cd worker && npm test
```

**Open decisions:** Optional user-selectable N deferred; tune min-altitude default after more real traffic; settings tag-chip chrome explore later; callsign enrichment cache follow-up after this plan.

**Open items:** **Pending:** push `main` + Pi env/sync + public smoke. **Deferred:** Phase 6 poster polish/UAT. Rotate secrets exposed in chat when convenient. Settings/geocoder/livery deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).

**Last updated:** 2026-08-02 — enrich efficiency implemented; local UAT PASS; next = commit/push + Pi

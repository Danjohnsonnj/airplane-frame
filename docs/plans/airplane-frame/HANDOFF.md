# airplane-frame - Handoff

**Goal:** Personal web app showing up to **10** nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Plane silhouettes **DONE**. Enrich efficiency + pack size **DONE**. Phase 6.5 Pi Tunnel **DONE**. Fetch-timeout / hexdb hard-fail skip **DONE** (2026-08-03). Phase 6 poster polish **deferred**.

**Next action (cold-start executable):**

1. Read process.md (before any commit).
2. **Next exploration: B — adsbdb first-pass** (do not implement until asked for a plan/code). Replace hexdb first-pass with **adsbdb** (`GET https://api.adsbdb.com/v0/callsign/{cs}`, keyless; adapter in `providers.js` — not a URL/JSON drop-in). Keep AirLabs gap-fill + existing fetch timeouts / hard-fail skip pattern. Goal: restore fuller packs (~`PACK_SIZE`) while hexdb.io is down, without raising AirLabs burn.
   - **Parked (not chosen):** **A** — raise Pi `MAX_AIRLABS` temporarily (ops-only). Use only if B is delayed and thin packs are unacceptable.
3. **Deferred (do not start unless asked):** Phase 6 poster UAT/polish. Optional: callsign enrichment cache; tune min-altitude default.
4. Production: https://danjohnsonnj.github.io/airplane-frame/ → `https://api.danjnj.com`. Pi ops: [pi-worker.md](../../runbooks/pi-worker.md).

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (idle / next ask):**

- process.md — before committing
- tech-brief.md — pipeline, hexdb outage, options A/B
- docs/runbooks/pi-worker.md — ops / reboot / sync PATH
- lessons.md — fetch timeout + thin pack + sync `runuser` PATH

**Index (load on demand):**

- product-brief.md — background (may still say 3–5 historically)
- phases.md — phase status (6.5 DONE; Phase 6 polish deferred; enrich resilience noted)
- progress-log.md — dated history
- docs/runbooks/local-dev.md / pages.md / deploy-worker.md / secrets.md
- phase-6.plan.md / carrier-brand-alias.plan.md / visual-direction.md — poster locks + deferred polish
- spike/README.md / spike/CREDENTIALS.md — data APIs (+ adsbdb candidate note)
- .cursor/skills/airplane-frame-ops/SKILL.md — agent entry to runbooks
- `~/.cursor/plans/enrich_efficiency_pool_355002fc.plan.md` — enrich caps (reference)
- `~/.cursor/plans/fetch_timeout_hexdb_skip_16e530b6.plan.md` — timeout + hexdb skip (shipped)
- `~/.cursor/plans/plane_silhouette_ship_81841268.plan.md` — silhouette ship DONE

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
| Sync unit PATH | Must include `/usr/sbin:/sbin` so `runuser` works (`deploy/systemd/airplane-frame-sync.service`) |
| Secrets | `/etc/airplane-frame/worker.env` root:root mode 600 |
| Adapter | `worker/src/node/` — `npm run start:pi` |
| Env (live) | `MAX_ATTEMPT=36`, `MAX_AIRLABS=5`, `PACK_SIZE=10`, `MAX_RESULTS=20` |
| Outbound fetch | `FETCH_TIMEOUT_MS=10000`; hexdb hard-fail → request-scoped skip (`enrich.hexdbSkipped`) |
| Hexdb (2026-08-03) | Upstream down/hanging; packs thin (~≤`MAX_AIRLABS`) via AirLabs-only until A or B |
| File cache | `/var/lib/airplane-frame/cache.json` — ignores KV `expirationTtl`; clear manually if stuck stale |
| Last ship | `e744e6a` fetch timeout + hexdb skip; `59690a5` sync PATH; prior silhouettes / enrich |

**Verify before coding:**

```bash
git branch --show-current   # expect main
node --test js/lib.test.js js/plane-asset.test.js
cd worker && npm test
```

**Open decisions:** adsbdb adapter shape / whether to keep hexdb as tertiary fallback; optional user-selectable N deferred; tune min-altitude default; settings tag-chip chrome; callsign enrichment cache.

**Open items:** **Deferred:** Phase 6 poster polish/UAT. Rotate secrets exposed in chat when convenient. Settings/geocoder/livery deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).

**Last updated:** 2026-08-03 — next exploration locked to **B (adsbdb)**; A parked; hexdb outage resilience shipped

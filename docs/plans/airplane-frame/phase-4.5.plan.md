# Phase 4.5 — KV/stale + local testing mode

**Status:** DONE 2026-08-01  
**Entry:** [HANDOFF.md](./HANDOFF.md)

## Delivered

- Workers KV `FLIGHT_CACHE` replaces `caches.default` for enriched candidates
- `resolveCandidates` with fresh (5 min) + stale fallback (30 min KV TTL)
- One retry on airplanes.live 429/5xx
- Response fields: `stale`, `ageSeconds`, `candidateCount`
- Front end: `resolveWorkerBase` (localhost → `:8788`), stale status label, backend hint
- `scripts/dev-pages.sh`, `scripts/dev-worker.sh`, [local-dev.md](../../runbooks/local-dev.md)

## Verify bar (met)

- `cd worker && npm test` and `node --test js/lib.test.js` pass
- Production Worker deployed with KV binding
- Local routing documented for cold-start agents and humans

## UAT (user)

- [x] Cold start from local-dev.md — flights load under normal refresh spacing (PASS 2026-08-01)
- [x] Double Refresh within a minute — stable pack (PASS 2026-08-01)
- [x] Stop Wrangler on localhost — connection error (no silent prod fallback) (PASS 2026-08-01)
- [ ] GitHub Pages uses production Worker; stale/age visible if upstream flaps — **DEFERRED** until local changes are pushed / Pages rebuilds

# Progress log (append-only, newest last)

## 2026-07-31 - Session 1: Interview complete → plan-build init

- Happened: Ran `/start-interview` and locked product/architecture decisions for airplane-frame. Initialized plan-build tree at `docs/plans/airplane-frame/` (own-project). Repo remains greenfield (no app code).
- Verified: none (planning artifacts only).
- Learned: Pure Pages→API is likely infeasible for required destination field; Pages + free Worker is the chosen path. Actions snapshot (D) was considered for Pages-only hosting then rejected so location can live in the browser. Maintenance must include runbooks + a Cursor skill.
- Overwrote: Architecture preference moved from exploring A/D to locked B during the interview; reflected as current truth in tech-brief and product-brief (no prior plan briefs to correct).

## 2026-07-31 - Session 2: Phase 1 keyless spike + credential guide

- Happened: Added `spike/run_spike.py`, `spike/CREDENTIALS.md`, `spike/.env.example`, root `.gitignore`. Ran keyless JC spike (airplanes.live + hexdb). Documented OpenSky / AirLabs / Aviationstack signup steps for the user (no keys configured yet).
- Verified: `python3 spike/run_spike.py` → PASS (≥3 enriched flights); sample written to `spike/out/jc_sample.json` (gitignored).
- Learned: airplanes.live requires a User-Agent or it 403s from urllib. hexdb meets the count bar but destination quality is suspect; ownOp is a weak carrier label. Live enrichment APIs still needed before locking the production stack.
- Overwrote: HANDOFF phase → in progress; tech-brief verified findings updated with spike results.

## 2026-07-31 - Session 2b: Phase 1 locked; enter Phase 2

- Happened: User locked Phase 1 after AirLabs-enriched spike looked metro-plausible (brand carriers, EWR/LGA routes). OpenSky left optional/deferred. Updated HANDOFF, tech-brief, phases, CREDENTIALS emphasis.
- Verified: `python3 spike/run_spike.py` with AirLabs → PASS; top results tagged `[airlabs]`.
- Learned: Prefer AirLabs airline_name over airplanes.live ownOp; keep hexdb as fallback only.
- Overwrote: Phase 1 → DONE; current phase → Phase 2 Worker BFF; locked data stack table in tech-brief.

## 2026-07-31 - Session 3: Phase 2 Worker scaffold (awaiting Cloudflare account)

- Happened: Scaffolded `worker/` (auth, airplanes.live + AirLabs pipeline, 5‑min cache), unit tests (11 pass), runbooks (cloudflare-signup, secrets, deploy-worker), and `.cursor/skills/airplane-frame-ops`. User has no Cloudflare account yet — deploy/`wrangler dev` blocked on signup + login.
- Verified: `cd worker && npm test` → 11 pass.
- Learned: n/a new API gotchas this slice.
- Overwrote: HANDOFF → Phase 2 in progress; next action = Cloudflare signup then local wrangler verify.

## 2026-07-31 - Session 3b: Wrangler OAuth + local verify PASS; deploy blocked

- Happened: User completed Wrangler OAuth. Created `worker/.dev.vars`. `wrangler dev` on :8788. Curl verify: health 200, no/bad auth 401, auth JC query 200 with 9 AirLabs-enriched flights (PASS). Deploy failed: Cloudflare email not verified for Workers + workers.dev subdomain not registered.
- Verified: local 401/200 + ≥3 enriched flights with carrier/destination/planeType.
- Learned: Deploy needs email verify + workers.dev onboarding before secrets/deploy succeed.
- Overwrote: HANDOFF next action → verify email + register workers.dev subdomain, then redeploy.

## 2026-07-31 - Session 3c: Remote deploy + verify PASS; Phase 2 done

- Happened: User confirmed email verify + `danjohnsonnj.workers.dev` subdomain. Secrets bulk + deploy succeeded. Initial TLS handshake failures cleared after `workers_dev = true` redeploy / brief propagation. Remote curl: health 200, no auth 401, auth JC 200 with 11 enriched flights (incl. Dreamliner CPT).
- Verified: `https://airplane-frame.danjohnsonnj.workers.dev` PASS.
- Learned: Fresh workers.dev URL may briefly fail TLS until subdomain/workers_dev is fully enabled; retry after explicit `workers_dev = true` deploy.
- Overwrote: Phase 2 → DONE; HANDOFF next → Phase 3 Pages UI.

## 2026-07-31 - Session 3d: Docs/runbooks/spike/handoff sync

- Happened: Brought runbooks, spike README/CREDENTIALS, HANDOFF, tech-brief, process, and airplane-frame-ops skill up to date with deployed Worker URL, endpoints, secrets/bulk notes, email+subdomain checklist, and TLS gotcha.
- Verified: n/a (documentation only).
- Learned: n/a.
- Overwrote: HANDOFF current phase → Phase 3 not started; tech-brief architecture marked Worker live; runbooks reflect production URL `https://airplane-frame.danjohnsonnj.workers.dev`.

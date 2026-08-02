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

## 2026-07-31 - Session 4: Phase 3 Pages UI implemented

- Happened: Root static site (`index.html`, `css/app.css`, `js/{config,lib,app}.js`) calling production Worker; Leaflet map click; Open-Meteo place search; device geolocation; localStorage for secret/pin/radius/refresh/minAltitude (default 5000 ft client filter); shows all enriched candidates. Added `docs/runbooks/pages.md`, README, unit tests. Place search + geolocation pulled forward from Phase 5/Later.
- Verified: `node --test js/lib.test.js` 7 pass; local `http.server` page load; place search sets JC pin; wrong secret → unauthorized; live Worker + filter path → e.g. 11 raw / 3 ≥5000 ft with required fields. Pages enable + two-device UAT still user-side.
- Learned: Open-Meteo geocoding API is CORS-friendly for browser place search (no key).
- Overwrote: HANDOFF → Phase 4 next; Phase 3 IMPLEMENTED (Pages UAT open); Phase 5 narrowed; tech/product briefs updated.

## 2026-07-31 - Session 4b: Secret-field UX + docs (AirLabs vs APP_SHARED_SECRET)

- Happened: User pasted `AIRLABS_API_KEY` into the UI and got 401. Relabeled field to `APP_SHARED_SECRET`, hint + runbook table for which secret goes where; on 401 clear stored secret and pause auto-refresh; secret only persisted after successful 200 or explicit Save.
- Verified: `node --test js/lib.test.js` (includes unauthorizedStatusMessage).
- Learned: Two Worker secrets are easy to conflate; name the env var in the UI.
- Overwrote: secrets.md, pages.md, README, deploy-worker, skill, lessons, tech-brief, CREDENTIALS, `.dev.vars.example`.

## 2026-07-31 - Session 4c: Pages enable + two-device UAT PASS

- Happened: Enabled GitHub Pages via `gh` (`main` / root); repo homepage set. User confirmed app works on two devices at https://danjohnsonnj.github.io/airplane-frame/.
- Verified: Pages build `built`; site assets 200; Worker health 200; two-device UAT PASS (user).
- Learned: Default branch is `main` (docs had stale `master`).
- Overwrote: HANDOFF open decisions drop UAT; Phase 3 → DONE; pages/phases/tech-brief/phase-3.plan updated.

## 2026-07-31 - Session 5: Phase 4 pack + filters DONE (UAT PASS)

- Happened: Implemented Worker diversity pack (`PACK_SIZE` 5), candidate cache then filter/pack, query filters (carrier allow/deny, nyc dest group prefer/exclude, unique, minAltitudeFt); Pages UI persists filters; deployed Worker; commit `ad75ffe`. User completed Phase 4 UAT checklist.
- Verified: worker + front-end unit tests; local/prod pack ≤5; UAT PASS (user).
- Learned: Cache candidates separately from packed response so filter toggles reuse enrich within TTL.
- Overwrote: Phase 4 → DONE; HANDOFF → Phase 5; tech/product/phases/lessons/phase-4.plan/pages UAT checked.

## 2026-08-01 - Session 6: Phase 4.5 KV/stale + local dev DONE

- Happened: KV namespace `FLIGHT_CACHE`; `worker/src/cache.js` + `resolveCandidates`; provider 429 retry; `index.js` wired to KV/stale; deployed Worker. Front end `resolveWorkerBase`, stale `formatPackStatus`, backend hint in status. Added `scripts/dev-*.sh`, `docs/runbooks/local-dev.md`, updated README/runbooks/ops skill.
- Verified: worker 34 tests + front-end 15 tests pass; prod curl 200×2 with `candidateCount`; KV binding in deploy output.
- Learned: airplanes.live 429 on Cloudflare shared egress; local Wrangler uses own IP for testing.
- Overwrote: Phase 4.5 → DONE; HANDOFF → Phase 5; tech-brief, lessons, phases, phase-4.5.plan.

## 2026-08-01 - Phase 4.5 local UAT PASS

- Happened: User cold-start from `docs/runbooks/local-dev.md`; double refresh stable; stop Wrangler → network error (no silent prod fallback).
- Verified: local UAT checklist items 1–3 in phase-4.5.plan.md — PASS.
- Deferred: GitHub Pages UAT (item 4) — unpushed local changes; re-run after commit/push to https://danjohnsonnj.github.io/airplane-frame/
- Overwrote: HANDOFF open items; phase-4.5.plan UAT section.

## 2026-08-01 - Phase 4.5 pushed; Pages UAT unblocked

- Happened: Committed and pushed `3705970` (`feat: add KV flight cache, stale fallback, and local Wrangler preview`) to `main`/origin.
- Verified: working tree clean; `main` matches `origin/main`.
- Unblocked: Phase 4.5 Pages UAT item 4 — re-run at https://danjohnsonnj.github.io/airplane-frame/ after Pages rebuild.
- Overwrote: HANDOFF open items; phase-4.5.plan UAT; phases.md Phase 4.5 status.

## 2026-08-01 - Phase 4.5 Pages UAT PASS

- Happened: User verified GitHub Pages → production Worker (stale/age UI as applicable).
- Verified: phase-4.5.plan.md UAT item 4 — PASS; full Phase 4.5 UAT complete.
- Overwrote: HANDOFF open items cleared; phase-4.5.plan + phases.md Phase 4.5 status.

## 2026-08-01 - Phase 5 visual-direction note DONE

- Happened: Interview-locked poster IA into `docs/plans/airplane-frame/visual-direction.md` (classic travel posters + baggage-tag secondary; poster-main / settings-secondary SPA; sticky `?view=`; responsive wall; staged fidelity). Synced HANDOFF, product-brief, phases, tech-brief. Geocoder polish deferred. Next: inspiration → deeper design interview → `design-mock-probe`.
- Verified: note has Purpose/Locked/Intake/Deferred/Next; HANDOFF links resolve; product-brief rationale no longer “gallery second.”
- Learned: n/a.
- Overwrote: Phase 5 → DONE; HANDOFF next action → design path; open decisions drop geocoder-vs-note-only.

## 2026-08-01 - Design reference intake confirmed

- Happened: User confirmed takeaways for eight files in `docs/design-reference/` (3 luggage tags + 5 posters). Wrote Reference intake + working inferences into `visual-direction.md`. Explicitly not palette/type locks — refine via design interview + `design-mock-probe`.
- Verified: intake table cites paths; reject cluster includes people/figures/dense illustration; HANDOFF next action updated.
- Learned: Stage-1 panels biased to solid fields + type/ephemera; Pan Am circles + TWA/LAX glance stack inform tag/status chips.
- Overwrote: visual-direction Reference intake *(none yet)* → confirmed rows; Next path step 1 DONE.

## 2026-08-01 - Design interview locks → mock-probe ready

- Happened: Deeper design interview. Locked mobile-first responsive; panel = hero (airline + flight#) above luggage tag (dest code + route/aircraft/altitude/distance); tag horizontal in rows / bespoke vertical in columns; sequential swatch book + reserved neutral status; status = one luggage tag (not chrome chip); empty/error hero strip "Nearby flights"; typography dual-family direction; motion = quiet state + staged settle. API field gaps acked. Wrote locks into visual-direction; added design-mock-probe pointer + design-mocks README; synced HANDOFF/phases/product-brief.
- Verified: HANDOFF next action = poster `design-mock-probe`; required reading points at pointer + visual-direction + skill.
- Learned: Destination-led panel hierarchy superseded by airline-led hero + tag-led dest code; status should reuse tag motif rather than a separate chip.
- Overwrote: visual-direction panel hierarchy / chrome / empty-error / deferred list; HANDOFF phase → design path (mock probes).

## 2026-08-01 - Poster mock-probe lock pass

- Happened: Grill lock pass for poster wall. Provisional locks: mixed warm+cool swatch book; condensed display + heavy grotesque; status tag four slots (EMPTY/STALE/WAIT/ERR + status/detail/action/updated); corner glyph settings chrome (tag-chip explore later); dual ink; hero-led ~60/40. Building `docs/design-mocks/poster-ad-wall.html`.
- Verified: locks written into visual-direction mock-provisional rows; HANDOFF next = browser review.
- Learned: All mock-probe tokens stay soft until browser review.
- Overwrote: deferred “exact hexes/type/status” → mock-provisional locks; mock inventory → in probe.

## 2026-08-01 - TEMP local airline capture

- Happened: For design carrier inventory: temporary `candidateCarriers` on `/flights`, local `CACHE_TTL_SECONDS=60`, poller `scripts/capture-airlines.mjs` → `docs/scratch/airlines-seen.json` (gitignored). Documented run + teardown in `docs/runbooks/local-dev.md`.
- Verified: first poll wrote 6 unique carriers; wrangler shows `CACHE_TTL_SECONDS ("60")`.
- Learned: Wrangler access logs do not include airline names — must read response JSON / candidate list.
- Overwrote: HANDOFF open items + tech-brief TEMP note; local-dev runbook section.

## 2026-08-01 - Airline capture ended

- Happened: Stopped poller; reverted TTL to 300, removed `candidateCarriers` / `uniqueCarriers` / capture scripts / local-dev TEMP section. Wrote durable summary to `docs/design-reference/airlines-seen-2026-08-01.md` (31 raw strings / ~24 design brands over 48 polls).
- Verified: `cd worker && npm test` after teardown.
- Learned: AirLabs brand names coexist with ALL-CAPS INC and trustee/lessor `ownOp` strings — normalize for poster art.
- Overwrote: HANDOFF open items; tech-brief TEMP note removed.

## 2026-08-01 - Poster mock carrier brand colors + stroke

- Happened: Added 50 airline tokens + `data-carrier` selectors to `poster-ad-wall.html`; `.airline` brand fill + `-webkit-text-stroke` (`--panel-ink` fallback; `contrast-color` + `color-mix` in `@supports`). Added `gen-carrier-css.mjs` with marker-based regen from `airline-brand-colors.md`. Fixed malformed `contrast-color()` parenthesis. Codified contract in visual-direction.
- Verified: browser smoke — United fill #005DAA, semi-transparent white stroke via `color-mix`; tag/flight# stay panel ink; generator re-run succeeds.
- Learned: Exact `carrier` string match required; stroke outline replaces offset lithograph shadow.
- Overwrote: mock inventory; visual-direction carrier-color row; progress-log duplicate entries merged.

## 2026-08-01 - Handoff for next design-probe session

- Happened: Session wrap — carrier colors + stroke + gen-carrier-css.mjs landed; HANDOFF next action = continue browser review of brand-colored `.airline` text.
- Verified: gen-carrier-css.mjs + browser smoke on mock.
- Learned: n/a.
- Overwrote: HANDOFF next action + required reading (airline-brand-colors.md).

## 2026-08-01 - Poster mock probe LOCKED → Phase 6

- Happened: Completed poster wall design probe in `poster-ad-wall.html`: carrier brand as full panel ground (`data-carrier` on article); unknown carriers get unique sequential swatch (`ground-*`); hero + tag share complementary `--tag-ink` (OKLCH hue +180°, lightness push, 52/48 mix with contrast-color); unique ground per pack rule. Updated visual-direction locks, HANDOFF → Phase 6 poster SPA, phases.md, mock inventory.
- Verified: browser review on prevalence-based carrier mix (Endeavor, Southwest, Jetblue, Frontier, Porter); gen-carrier-css.mjs emits `.flight-panel[data-carrier]` selectors.
- Learned: Complementary ink on hero (not just tag) reads as one luggage-tag zone; lightness bias + higher contrast-color share improves legibility without losing hue opposition.
- Overwrote: visual-direction panel ground/ink rows; mock-provisional → locked for color system; design-mock-probe-pointer green-light; HANDOFF phase + next action.

## 2026-08-01 - Phase 6 poster SPA implemented

- Happened: Shipped poster/settings SPA views with sticky `?view=` routing; `css/poster.css` + `css/carriers.css`; extended `gen-carrier-css.mjs` → `js/carrier-brands.js`; poster wall render (flight panels + status luggage tag); `assignPanelGrounds`, wall mode, status helpers + tests; `phase-6.plan.md`.
- Verified: `node --test js/lib.test.js` and `cd worker && npm test` pass; gen script idempotent.
- Learned: Default-route poster switch waits for successful boot fetch while settings stay visible; duplicate carrier in pack initially fell back to unique swatch (revised — duplicates share brand color).
- Overwrote: HANDOFF (UAT next), phases.md Phase 6 status, design-mocks README (gen outputs).

## 2026-08-01 - Carrier brand aliases (Phase 6 follow-up)

- Happened: `resolveCarrierBrand` + `CARRIER_ALIASES` in `js/lib.js`; `worker/src/carrier-aliases.js` normalizes ownOp INC strings in `buildFlightRow`; expanded FE + Worker tests; `carrier-brand-alias.plan.md`; UAT notes for brand-colored INC rows.
- Verified: `node --test js/lib.test.js` (33); `cd worker && npm test` (36).
- Learned: Hexdb `ownOp` legal names (`UNITED AIRLINES INC`) poisoned exact `data-carrier` match — minimal alias map + Worker normalize required for brand CSS to apply; regionals/trustees still swatch-only (not in 50-color book).
- Overwrote: visual-direction deferred alias row; HANDOFF UAT focus; phase-6 UAT checklist.

## 2026-08-01 - Unique swatch rule scoped to non-brand grounds

- Happened: `assignPanelGrounds` always applies brand `data-carrier` for book carriers (duplicates share color); `ground-*` uniqueness only for unknown carriers.
- Verified: `node --test js/lib.test.js`.
- Learned: Prior “no duplicate background token” rule was too broad — two Delta INC rows must both brand, not fall back to sun/navy.
- Overwrote: visual-direction unique-ground row; phase-6.plan, lessons, mock header comments.

## 2026-08-01 - KV empty-aware cache hotfix (option A)

- Happened: `resolveCandidates` empty-aware freshness — short `EMPTY_CACHE_TTL_SECONDS` (60) for empty records; prefer last-good pack when upstream returns `[]`; bumped `CACHE_TTL_SECONDS` to 600 and `STALE_TTL_SECONDS` to 3600. Extended `worker/test/cache.test.js` (40 tests). Updated lessons, tech-brief, secrets runbook.
- Verified: `cd worker && npm test` pass (40); production deploy + smoke curl.
- Learned: Empty upstream success poisoned fresh KV same as 429 — GitHub Pages EMPTY while local Wrangler worked; empty TTL + last-good serve mitigates without unique egress.
- Overwrote: tech-brief cache TTL facts; lessons egress note; HANDOFF open items.

## 2026-08-02 - Next exploration: Pi-hosted Worker + Cloudflare Tunnel

- Happened: Confirmed production rate-limit/EMPTY remains a **blocker** despite KV mitigations and LAN local preview (`06a4ecc`). Chose Option 1 (Pi runs Worker logic; Cloudflare Tunnel publishes `api.<domain>`; GitHub Pages stays on `main`). Authored implementation plan at `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md`. Phase 6 poster UAT paused until egress is reliable.
- Verified: n/a (docs / planning only).
- Learned: Shared Cloudflare Worker egress cannot be fixed by cache alone; dedicated home-network egress is the next exploration.
- Overwrote: HANDOFF (phase + next action + required reading); tech-brief gap #7; phases.md Phase 6 UAT paused + Phase 6.5; lessons egress note.

## 2026-08-02 - Pi adapter slices 1–2 + danjnj.com Cloudflare cutover

- Happened: On `feature/pi-node-adapter`, implemented Node adapter + `FileKv` (`worker/src/node/`), tests, `start:pi`, `.pi.env.example` — commit `379e268`. Locked API hostname **`https://api.danjnj.com`** (zone `danjnj.com`, Cloudflare Free). Added domain at Cloudflare; Squarespace nameservers → `amy.ns.cloudflare.com` / `shane.ns.cloudflare.com`. Restored Squarespace site by setting `www` (and recommending apex A’s) to **DNS only** while Universal SSL was missing. Pi baseline: `mypi` / `192.168.1.46` Wi‑Fi, git present, **Node not installed**; SSH works from Terminal.app (Cursor LAN blocked — missing `NSLocalNetworkUsageDescription`).
- Verified: `cd worker && npm test` (47); `curl http://127.0.0.1:8788/health` → 200; `dig NS danjnj.com` → Cloudflare NS; `https://www.danjnj.com` → 200 after grey-cloud.
- Learned: Proxied hostnames without an issued Universal cert → HTTPS handshake failure; grey-cloud (DNS only) restores origin TLS immediately. Cursor cannot reach LAN until app ships Local Network usage string.
- Overwrote: HANDOFF next → Slice 3.2; phases 6.5 status; tech-brief target hostname; plan todos slices 1–2 complete / domain in progress.

## 2026-08-02 - Slice 3 Pages routing to api.danjnj.com

- Happened: Updated docs/plan for Pi progress + Cloudflare cutover. Implemented Slice 3.2: `PROD_API_BASE=https://api.danjnj.com`, `CLOUDFLARE_WORKER_BASE` + `?worker=cloudflare` rollback, `?worker=prod` → Pi API; tests + pages/local-dev/README/index hints.
- Verified: `node --test js/lib.test.js` (37); `cd worker && npm test` (47).
- Learned: n/a new.
- Overwrote: HANDOFF next → Slice 4; plan `route-pages-to-pi` completed.

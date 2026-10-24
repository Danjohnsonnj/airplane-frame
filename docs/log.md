# Directory Update Log

## 2026-10-24

- Cold-start docs: HANDOFF next action, AGENTS.md, runbooks, and the ops skill now say production stays on the Pi, `workers.dev` is blocked by adsb.fi HTTP 403, and the Pi is `mypi.local` (`.184` / `.45`), not `.46`. `adsb-fi-positions` is not on the Pi until it lands on `main`.

## 2026-10-24

- Local poster UAT PASS on `127.0.0.1:8080` with saved settings. Worker tests 86 pass; front-end tests 60 pass; local pack of 10 complete flights; repeat fetch served from cache.
- Positions feed: Worker `fetchAdsbFi` → adsb.fi opendata v3 (replaces airplanes.live after HTTP 403). UI settings cite adsb.fi. Current-state docs/runbooks/HANDOFF/tech-brief updated; historical airplanes.live lessons retained. Cloudflare Worker deploy returns adsb.fi HTTP 403, so Pages stay on the Pi tunnel.

## 2026-08-30

- Docs review pass: Archive moved off Settled onto hub **Retired**; concepts labeled empty slot; runbook index uses leaf titles; archived mock README links and gen-carrier command fixed; historical progress-log paths restored; stale poster/discovery copy updated.
- OKF retrofit: added hub (`docs/index.md`), folder indexes, `AGENTS.md`, `.cursor/skills/docs-maintenance/`. Converted runbooks and design-reference markdown to OKF frontmatter. Superseded `docs/runbooks/README.md` with `docs/runbooks/index.md`. Archived visual mocks to `docs/archive/design-mocks/`; retained `docs/design-mocks/gen-carrier-css.mjs`.

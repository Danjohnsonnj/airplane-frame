# Silhouette scroll-motion probe + gated ship

**Status:** Phase A in progress — explore mock

## Entry

Start here: this plan.

**Hard gate:** Phase B (docs + production ship) starts **only** after user probe UAT approval. Do not amend [`visual-direction.md`](visual-direction.md) Motion lock during Phase A.

## Required reading

- [docs/agents/design-mock-probe-pointer.md](../../agents/design-mock-probe-pointer.md) — `mock_dir`, authority order
- [docs/design-mocks/README.md](../../design-mocks/README.md) — inventory + local HTTP
- [visual-direction.md](visual-direction.md) — Hero silhouette + Motion locks (**preserve in Phase A**; amend in Phase B only)
- [docs/design-mocks/poster-ad-wall.html](../../design-mocks/poster-ad-wall.html) — silhouette rest poses / panel chrome to **fork from** (do **not** edit)
- [css/poster.css](../../../css/poster.css) — live rest transforms, `#view-poster { overflow: scroll }`, settle keyframes
- [js/app.js](../../../js/app.js) — `createFlightPanel` / `fillPlaneSilhouette` (Phase B only)
- [process.md](process.md) — before any commit
- [lessons.md](lessons.md) — silhouette SoT; mock ≠ ship DOM

**Do not load:** full design-reference images, Worker/Pi runbooks, paper-texture plans (unless diagnosing stacking).

## Prerequisites

- Branch: `main` or feature branch off `main`
- Env: Phase A — local static HTTP only. Phase B — local poster preview + `worker/.dev.vars` per [local-dev.md](../../runbooks/local-dev.md)
- Tools: browser with CSS scroll-driven animations (Chromium primary); DevTools; Node for existing tests in Phase B
- User gates: Phase A explore UAT; Phase B blocked until that pass
- Commit: only when the user explicitly asks

## Locked decisions (interview 2026-08-05)

| Topic | Lock |
|-------|------|
| Arrival | One-shot (not scrubbed); hard latch after arrive |
| Trigger end | Panel center at viewport center (rows: vertical; columns: horizontal) |
| First paint | Panels already past center: time-based fly-in after panel settle, stagger **100–120ms** |
| Settle order | Panel `settle` (~0.48s + `--delay`) completes first; then past-center silhouette arrivals |
| Motion | `transform` only; opacity stays **0.18**; rows **L→R**; columns **bottom→top** into current rest poses |
| Start pose | Fully outside `.hero` clip (`overflow: hidden`) |
| Scroll span | Panel enters view → panel center at viewport center (`view()` timeline + range) |
| Duration (time-based) | ~0.45–0.55s (settle family) |
| Reduced motion | Instant rest pose |
| Unsupported browsers | Progressive enhancement → static rest (`@supports` / feature detect) |
| Rebuild | Replay arrivals whenever the wall is rebuilt |
| Probe shape | **One** HTML mock with **rows/columns toggle** |
| Docs timing | **No** `visual-direction` Motion amend until Phase B (after UAT) |

## Architecture (probe + ship)

**Latch mechanism:** script observes each `.flight-panel` against the scroll root. When the panel’s center crosses the viewport center along the scroll axis (or time-based animation ends), add `.arrived` on `.plane-silhouette`. CSS for `.arrived` forces the rest `transform` and disables `animation` / `animation-timeline`.

**Scroll wiring:** `view-timeline-name` on `.flight-panel`; `animation-timeline` on `.plane-silhouette` with `animation-range` mapped enter→center.

## Phase A — Design probe

### 0 — Persist plan

- **Verify:** `test -f docs/plans/airplane-frame/silhouette-scroll-motion.plan.md`

### 1 — Explore mock

- [`docs/design-mocks/silhouette-scroll-motion.html`](../../design-mocks/silhouette-scroll-motion.html)
- **Verify:**
  ```bash
  python3 -m http.server 8765 --directory docs/design-mocks
  # open http://localhost:8765/silhouette-scroll-motion.html
  ```

### 2 — Mock inventory only

- Row in [`docs/design-mocks/README.md`](../../design-mocks/README.md): `silhouette-scroll-motion.html` · **EXPLORE**
- Do **not** edit `visual-direction.md`, `HANDOFF.md`, or `phases.md` in Phase A.

### 3 — Probe UAT (user gate)

- **Verify:** User explicitly approves probe. **Stop here until approved.**

## Phase B — Docs + production ship (after UAT only)

### 4 — Lock docs

- Amend Motion row in `visual-direction.md`; update HANDOFF, progress-log, phases, lessons as needed.

### 5 — Ship to poster SPA

- [`css/poster-silhouette-motion.css`](../../../css/poster-silhouette-motion.css) + [`js/app.js`](../../../js/app.js) latch helper
- **Verify:** `node --test js/lib.test.js js/plane-asset.test.js js/paper-texture.test.js`

## Out of scope

- Editing `poster-ad-wall.html`
- Opacity/scale flourishes; continuous ambient; scrubbed reverse flight
- JS polyfill for browsers without scroll timelines
- Phase 6 full poster polish UAT

## UAT

**Phase A (probe)**

- [ ] Rows L→R from fully clipped → rest at vertical center; hard latch
- [ ] Columns bottom→top → rest at horizontal center; hard latch
- [ ] Toggle rows/columns; arrivals replay
- [ ] Past-center panels: settle, then ~100–120ms staggered fly-ins (~0.5s each)
- [ ] Reduced motion / no-timeline: static rest
- [ ] Opacity remains 0.18; text stays above silhouette

**Phase B (ship)** — same behaviors on live poster + paper texture still correct; tests green

## Risk notes

- `#view-poster` is the real scroll container — mock must mirror that
- Keyframes must end on the **exact** live rest transform strings from `poster.css`
- Hard latch needs JS; `animation-fill-mode` alone will reverse on scroll-back
- First-paint classification must run after layout (fonts/SVG insert)

**Last updated:** 2026-08-05

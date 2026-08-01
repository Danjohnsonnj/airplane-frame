# Process - how we work on this effort

Durable methodology. Read once per session before committing. Reached from HANDOFF.md.

**Adoption mode:** own-project

**Plan root:** `docs/plans/airplane-frame/`

## Cold-start protocol

1. Start from HANDOFF.md — the explicit entry point you are pointed at directly; read it always (phase, next action, required reading).
2. Load ONLY the leaves under HANDOFF.md "Required reading (this phase)".
3. Pull any other leaf from the Index on demand.

## Update discipline

- Briefs hold CURRENT truth: overwrite in place; correct mistakes directly.
- progress-log.md holds HISTORY: append-only dated entries; never rewritten.
- lessons.md holds the CURATED TOOLKIT: reusable gotchas and script/verify outcomes; add when useful, prune when obsolete.
- Single source of truth per fact: the next action lives only in HANDOFF.md.

## Session-handoff ritual (user-initiated wrap-up)

1. Overwrite affected brief(s) in place.
2. Refresh HANDOFF.md (phase, next action, next-phase required reading, open decisions, last-updated).
3. Append a dated progress-log.md entry (happened / verified / learned / overwrote).
4. Fold any reusable gotcha or script/verify outcome into lessons.md (prune obsolete ones).
5. Commit per the active adoption mode below, only when the user asks.

## Adoption mode: own-project (default)

- Artifacts are tracked and committed normally alongside code.

## Adoption mode: contributor (someone else's repo)

- Keep artifacts OUT of any upstream PR. Do NOT add them to the tracked .gitignore.
- Keep code and artifacts in SEPARATE commits.
- Open PRs from a fresh branch off the upstream base that omits the artifact commits.
- Upstream-facing design docs go in the host repo's house style/location, separate from these artifacts.

## Legacy path

Older single-effort trees may live at `docs/_plan/`. New efforts use `docs/plans/<effort-slug>/` so multiple plans can coexist.

## Maintenance surfaces (project-specific)

- Human ops: `docs/runbooks/` (deploy, secrets rotation, API incident steps) — create during Phase 2+.
- Agent entrypoint: a Cursor project skill that points at those runbooks (do not duplicate runbook content into the skill).

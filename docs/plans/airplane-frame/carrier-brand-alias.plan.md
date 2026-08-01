# Carrier brand aliases (Phase 6 follow-up)

**Status:** DONE 2026-08-01  
**Entry:** [HANDOFF.md](./HANDOFF.md)

## Problem

Poster brand CSS uses exact `data-carrier` values from [airline-brand-colors.md](../../design-reference/airline-brand-colors.md). Live `/flights` rows often carried hexdb/`ownOp` legal strings (`UNITED AIRLINES INC`). Exact-match `assignPanelGrounds` failed → swatches only.

## Delivered

- `assignPanelGrounds` uses resolved book name; duplicate brands share color; swatch uniqueness for unknowns only
- [worker/src/carrier-aliases.js](../../worker/src/carrier-aliases.js) + `normalizeCarrierName` in `buildFlightRow`
- Tests: INC → brand, duplicate same carrier → shared brand color, trustee → swatch, `friendlyFetchErrorMessage` dev-worker hint
- `createFlightPanel` sets `data-carrier` only from `ground.dataCarrier` (not raw carrier)

## Alias set (shipped)

`UNITED AIRLINES INC` → `United Airlines`, `DELTA AIR LINES INC` → `Delta Air Lines`, `AMERICAN AIRLINES INC` → `American Airlines`, plus case-fold to brand book. Full ICAO map still deferred.

## UAT (user)

- [ ] Live pack with United/Delta (INC or brand) shows brand panel ground
- [ ] Duplicate same airline in pack → both panels use brand color
- [ ] Trustee / unknown carrier gets unique `ground-*` swatch (no repeated sun/navy within pack)
- [ ] Network error poster mentions `dev-worker.sh` when Worker down

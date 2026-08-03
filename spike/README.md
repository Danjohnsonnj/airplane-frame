# Spike (Phase 1)

Local scripts to prove free/trial flight data for a Jersey City pin. **Stack is locked** — prefer the Worker for day-to-day use; keep the spike for debugging enrichment without Wrangler.

## Locked stack

| Role | Source |
|------|--------|
| Positions + plane type | airplanes.live (no key) |
| Carrier + origin/destination | AirLabs (`AIRLABS_API_KEY`) |
| Destination fallback | hexdb.io (no key; **outage 2026-08-03** — see HANDOFF A/B) |
| Candidate fallback (exploration B) | adsbdb.com callsign API (keyless; not shipped yet) |

OpenSky / Aviationstack are optional and **not** required for MVP. Details: [CREDENTIALS.md](./CREDENTIALS.md).

## Run

```bash
cp spike/.env.example spike/.env
# set AIRLABS_API_KEY — never commit .env
python3 spike/run_spike.py
```

Writes `spike/out/jc_sample.json` (gitignored). Exit 0 = PASS (≥3 flights with carrier, destination, plane type).

## Relation to Worker

Production path: `worker/` → https://airplane-frame.danjohnsonnj.workers.dev  
Copy the same AirLabs key into `worker/.dev.vars` / Wrangler secrets ([docs/runbooks/secrets.md](../docs/runbooks/secrets.md)).

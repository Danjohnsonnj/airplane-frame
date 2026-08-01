import { normalizeCarrierName } from "./carrier-aliases.js";

const USER_AGENT = "airplane-frame-worker/0.1 (personal)";
const RETRY_DELAY_MS = 1200;

function isRetryableStatus(status) {
  return status === 429 || (status >= 500 && status < 600);
}

export async function fetchJson(url, init = {}) {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    ...(init.headers || {}),
  };
  const fetchImpl = init.fetch || fetch;
  const res = await fetchImpl(url, { ...init, headers });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${url}`);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function fetchAirplanesLive(lat, lon, radiusNm, deps = {}) {
  const fetchImpl = deps.fetch || fetch;
  const retryDelayMs = deps.retryDelayMs ?? RETRY_DELAY_MS;
  const url = `https://api.airplanes.live/v2/point/${lat}/${lon}/${radiusNm}`;

  async function attempt() {
    const payload = await fetchJson(url, { fetch: fetchImpl });
    return Array.isArray(payload?.ac) ? payload.ac : [];
  }

  try {
    return await attempt();
  } catch (err) {
    if (isRetryableStatus(err.status)) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      return await attempt();
    }
    throw err;
  }
}

export async function enrichAirLabs(callsign, apiKey) {
  if (!apiKey) return null;
  const url =
    `https://airlabs.co/api/v9/flight?flight_icao=${encodeURIComponent(callsign)}` +
    `&api_key=${encodeURIComponent(apiKey)}`;
  try {
    const data = await fetchJson(url);
    if (!data || data.error) return null;
    const resp = data.response;
    if (resp && typeof resp === "object" && !Array.isArray(resp)) return resp;
    if (Array.isArray(resp) && resp[0] && typeof resp[0] === "object") return resp[0];
    return null;
  } catch {
    return null;
  }
}

export async function enrichHexdb(callsign) {
  try {
    return await fetchJson(
      `https://hexdb.io/api/v1/route/icao/${encodeURIComponent(callsign.trim().toUpperCase())}`,
    );
  } catch {
    return null;
  }
}

/** Build a display row or null if required fields missing. */
export function buildFlightRow(aircraft, airlabs, hexdb) {
  const flight = (aircraft.flight || "").trim();
  const planeType = (aircraft.desc || "").trim() || (aircraft.t || "").trim();
  if (!flight || !planeType) return null;
  if (aircraft.alt_baro == null || aircraft.alt_baro === "ground") return null;

  let origin = null;
  let destination = null;
  let carrier = (aircraft.ownOp || "").trim() || null;
  let enrichmentSource = "none";

  if (airlabs) {
    origin = airlabs.dep_iata || airlabs.dep_icao || null;
    destination = airlabs.arr_iata || airlabs.arr_icao || null;
    carrier = airlabs.airline_name || airlabs.airline_icao || carrier;
    enrichmentSource = "airlabs";
  }

  if (!destination && hexdb?.route && typeof hexdb.route === "string" && hexdb.route.includes("-")) {
    const parts = hexdb.route.split("-");
    origin = origin || parts[0];
    destination = parts[parts.length - 1];
    enrichmentSource = enrichmentSource === "airlabs" ? "airlabs+hexdb" : "hexdb";
  }

  if (!destination || !carrier || !planeType) return null;

  carrier = normalizeCarrierName(carrier);

  return {
    flight,
    carrier,
    destination,
    origin,
    planeType,
    icaoType: aircraft.t || null,
    altitudeFt: aircraft.alt_baro,
    distanceNm: aircraft.dst ?? null,
    lat: aircraft.lat ?? null,
    lon: aircraft.lon ?? null,
    enrichmentSource,
  };
}

export async function enrichAircraftList(aircraftList, { airlabsKey, maxEnrich }) {
  const trimmed = [];
  for (const ac of aircraftList) {
    const flight = (ac.flight || "").trim();
    const planeType = (ac.desc || "").trim() || (ac.t || "").trim();
    if (!flight || !planeType) continue;
    if (ac.alt_baro == null || ac.alt_baro === "ground") continue;
    trimmed.push(ac);
  }

  trimmed.sort((a, b) => (a.dst ?? 999) - (b.dst ?? 999));
  const slice = trimmed.slice(0, maxEnrich);

  const out = [];
  for (const ac of slice) {
    const callsign = ac.flight.trim();
    const airlabs = await enrichAirLabs(callsign, airlabsKey);
    let hexdb = null;
    if (!buildFlightRow(ac, airlabs, null)) {
      hexdb = await enrichHexdb(callsign);
    }
    const row = buildFlightRow(ac, airlabs, hexdb);
    if (row) out.push(row);
  }
  return out;
}

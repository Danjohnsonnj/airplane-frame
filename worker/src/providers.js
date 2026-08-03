import { normalizeCarrierName } from "./carrier-aliases.js";

const USER_AGENT = "airplane-frame-worker/0.1 (personal)";
const RETRY_DELAY_MS = 1200;
/** Default outbound fetch budget (airplanes.live, hexdb, AirLabs). */
export const FETCH_TIMEOUT_MS = 10_000;

const AIRLABS_BREAKER_CODES = new Set([
  "month_limit_exceeded",
  "year_limit_exceeded",
  "hour_limit_exceeded",
  "unknown_api_key",
  "invalid_api_key",
  "expired_api_key",
]);

const AIRLINE_ISH_RE = /^[A-Z]{3}\d/i;

function isRetryableStatus(status) {
  return status === 429 || (status >= 500 && status < 600);
}

function isAirlineIsh(callsign) {
  return AIRLINE_ISH_RE.test((callsign || "").trim());
}

function isHexdbHardFailure(err) {
  if (!err) return false;
  if (err.name === "AbortError" || err.code === "TIMEOUT") return true;
  const status = err.status;
  if (status >= 500 && status < 600) return true;
  // Network / DNS failures typically have no HTTP status.
  if (status == null) return true;
  return false;
}

export async function fetchJson(url, init = {}) {
  const fetchImpl = init.fetch || fetch;
  const timeoutMs = init.timeoutMs ?? FETCH_TIMEOUT_MS;
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    ...(init.headers || {}),
  };
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const callerSignal = init.signal;
  const signal =
    callerSignal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([callerSignal, timeoutSignal])
      : timeoutSignal;

  /** Omit fetch/timeoutMs/signal so they are not forwarded as RequestInit unknowns. */
  const { fetch: _f, timeoutMs: _t, signal: _s, headers: _h, ...rest } = init;

  let res;
  try {
    res = await fetchImpl(url, { ...rest, headers, signal });
  } catch (err) {
    if (err?.name === "AbortError" || signal.aborted) {
      const timeoutErr = new Error(`timeout after ${timeoutMs}ms for ${url}`);
      timeoutErr.name = "AbortError";
      timeoutErr.code = "TIMEOUT";
      throw timeoutErr;
    }
    throw err;
  }
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

export async function enrichAirLabs(callsign, apiKey, deps = {}) {
  if (!apiKey) return null;
  const fetchImpl = deps.fetch || fetch;
  const url =
    `https://airlabs.co/api/v9/flight?flight_icao=${encodeURIComponent(callsign)}` +
    `&api_key=${encodeURIComponent(apiKey)}`;
  try {
    const data = await fetchJson(url, { fetch: fetchImpl });
    if (!data) return null;
    if (data.error) {
      const code = data.error.code;
      if (code && AIRLABS_BREAKER_CODES.has(code)) {
        return { _airlabsLimit: true, code };
      }
      return null;
    }
    const resp = data.response;
    if (resp && typeof resp === "object" && !Array.isArray(resp)) return resp;
    if (Array.isArray(resp) && resp[0] && typeof resp[0] === "object") return resp[0];
    return null;
  } catch {
    return null;
  }
}

export async function enrichHexdb(callsign, deps = {}) {
  const fetchImpl = deps.fetch || fetch;
  const init = { fetch: fetchImpl };
  if (deps.timeoutMs != null) init.timeoutMs = deps.timeoutMs;
  try {
    return await fetchJson(
      `https://hexdb.io/api/v1/route/icao/${encodeURIComponent(callsign.trim().toUpperCase())}`,
      init,
    );
  } catch (err) {
    if (isHexdbHardFailure(err)) {
      return { _hexdbUnavailable: true };
    }
    // Soft miss (404 / other 4xx): keep trying hexdb for later callsigns.
    return null;
  }
}

/** Build a display row or null if required fields missing. */
export function buildFlightRow(aircraft, airlabs, hexdb) {
  const flight = (aircraft.flight || "").trim();
  const planeType = (aircraft.desc || "").trim() || (aircraft.t || "").trim();
  if (!flight || !planeType) return null;
  if (aircraft.alt_baro == null || aircraft.alt_baro === "ground") return null;

  const hexdbData = hexdb && !hexdb._hexdbUnavailable ? hexdb : null;

  let origin = null;
  let destination = null;
  let carrier = (aircraft.ownOp || "").trim() || null;
  let enrichmentSource = "none";

  if (airlabs && !airlabs._airlabsLimit) {
    origin = airlabs.dep_iata || airlabs.dep_icao || null;
    destination = airlabs.arr_iata || airlabs.arr_icao || null;
    carrier = airlabs.airline_name || airlabs.airline_icao || carrier;
    enrichmentSource = "airlabs";
  }

  if (
    !destination &&
    hexdbData?.route &&
    typeof hexdbData.route === "string" &&
    hexdbData.route.includes("-")
  ) {
    const parts = hexdbData.route.split("-");
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

/**
 * Hexdb-first enrichment with AirLabs gap-fill under a hard per-fetch cap.
 * @returns {Promise<{ candidates: object[], stats: object }>}
 */
export async function enrichAircraftList(aircraftList, opts = {}) {
  const {
    airlabsKey,
    maxAttempt = 36,
    maxAirlabs = 5,
    maxResults = 20,
    minAltitudeFt = 0,
    fetch: fetchImpl = fetch,
  } = opts;

  const trimmed = [];
  for (const ac of aircraftList) {
    const flight = (ac.flight || "").trim();
    const planeType = (ac.desc || "").trim() || (ac.t || "").trim();
    if (!flight || !planeType) continue;
    if (ac.alt_baro == null || ac.alt_baro === "ground") continue;
    if (minAltitudeFt > 0 && Number(ac.alt_baro) < minAltitudeFt) continue;
    trimmed.push(ac);
  }

  trimmed.sort((a, b) => {
    const aIsh = isAirlineIsh(a.flight) ? 0 : 1;
    const bIsh = isAirlineIsh(b.flight) ? 0 : 1;
    if (aIsh !== bIsh) return aIsh - bIsh;
    return (a.dst ?? 999) - (b.dst ?? 999);
  });

  const slice = trimmed.slice(0, maxAttempt);
  const candidates = [];
  let airlabsCalls = 0;
  let hexdbCalls = 0;
  let attempted = 0;
  let breakerTripped = false;
  let hexdbUnavailable = false;

  for (const ac of slice) {
    if (candidates.length >= maxResults) break;

    attempted += 1;
    const callsign = ac.flight.trim();
    const deps = { fetch: fetchImpl };

    let hexdb = null;
    if (!hexdbUnavailable) {
      hexdbCalls += 1;
      hexdb = await enrichHexdb(callsign, deps);
      if (hexdb?._hexdbUnavailable) {
        hexdbUnavailable = true;
        hexdb = null;
      }
    }

    let row = buildFlightRow(ac, null, hexdb);

    if (!row && airlabsKey && !breakerTripped && airlabsCalls < maxAirlabs) {
      airlabsCalls += 1;
      const airlabs = await enrichAirLabs(callsign, airlabsKey, deps);
      if (airlabs?._airlabsLimit) {
        breakerTripped = true;
      } else {
        row = buildFlightRow(ac, airlabs, hexdb);
      }
    }

    if (row) candidates.push(row);
  }

  return {
    candidates,
    stats: {
      attempted,
      airlabsCalls,
      hexdbCalls,
      hexdbSkipped: hexdbUnavailable,
      complete: candidates.length,
      cached: false,
    },
  };
}

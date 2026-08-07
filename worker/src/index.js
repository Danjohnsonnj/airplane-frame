import { authorize, parseFlightsQuery } from "./auth.js";
import {
  candidateCacheKey,
  resolveCandidates,
} from "./cache.js";
import { selectPack } from "./pack.js";
import { enrichAircraftList, fetchAirplanesLive } from "./providers.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

function packEcho(parsed, packSize) {
  return {
    size: packSize,
    unique: parsed.unique,
    destGroup: parsed.destGroup,
    destGroupMode: parsed.destGroupMode,
    sortByDistance: parsed.sortByDistance,
  };
}

function packedResponse(parsed, candidates, packSize, cacheTtl, meta = {}) {
  const flights = selectPack(candidates, {
    size: packSize,
    unique: parsed.unique,
    sortByDistance: parsed.sortByDistance,
    minAltitudeFt: parsed.minAltitudeFt,
    carrierAllow: parsed.carrierAllow,
    carrierDeny: parsed.carrierDeny,
    destGroup: parsed.destGroup,
    destGroupMode: parsed.destGroupMode,
  });
  return {
    pin: {
      lat: parsed.lat,
      lon: parsed.lon,
      radiusMi: parsed.radiusMi,
      radiusNm: parsed.radiusNm,
    },
    count: flights.length,
    candidateCount: Array.isArray(candidates) ? candidates.length : 0,
    flights,
    cachedForSeconds: cacheTtl,
    stale: Boolean(meta.stale),
    ageSeconds: meta.ageSeconds ?? 0,
    pack: packEcho(parsed, packSize),
    enrich: meta.enrich,
  };
}

async function fetchFreshCandidates(parsed, env) {
  const aircraft = await fetchAirplanesLive(
    parsed.lat,
    parsed.lon,
    parsed.radiusNm,
  );
  const maxAttempt = Number(env.MAX_ATTEMPT || env.MAX_ENRICH || 36);
  const maxAirlabs = Number(env.MAX_AIRLABS || 5);
  const maxResults = Number(env.MAX_RESULTS || 20);
  const { candidates, stats } = await enrichAircraftList(aircraft, {
    airlabsKey: env.AIRLABS_API_KEY,
    maxAttempt,
    maxAirlabs,
    maxResults,
    minAltitudeFt: parsed.minAltitudeFt,
    sortByDistance: parsed.sortByDistance,
    kv: env.FLIGHT_CACHE,
    callsignCacheTtlSec: Number(env.CALLSIGN_CACHE_TTL_SECONDS || 900),
    callsignNegAdsbdbTtlSec: Number(env.CALLSIGN_NEG_ADSBDB_TTL_SECONDS || 600),
    callsignNegAirlabsTtlSec: Number(env.CALLSIGN_NEG_AIRLABS_TTL_SECONDS || 1800),
  });
  return { candidates, enrich: stats };
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true });
    }

    if (request.method !== "GET" || url.pathname !== "/flights") {
      return json({ error: "not found" }, 404);
    }

    if (!authorize(request, env.APP_SHARED_SECRET)) {
      return json({ error: "unauthorized" }, 401);
    }

    const parsed = parseFlightsQuery(url);
    if (parsed.error) return json({ error: parsed.error }, 400);

    const cacheTtl = Number(env.CACHE_TTL_SECONDS || 600);
    const staleTtl = Number(env.STALE_TTL_SECONDS || 3600);
    const emptyCacheTtl = Number(env.EMPTY_CACHE_TTL_SECONDS || 60);
    const packSize = Number(env.PACK_SIZE || 10);
    const pin = {
      lat: parsed.lat,
      lon: parsed.lon,
      radiusMi: parsed.radiusMi,
      radiusNm: parsed.radiusNm,
    };
    const key = candidateCacheKey(
      parsed.lat,
      parsed.lon,
      parsed.radiusNm,
      parsed.sortByDistance,
    );

    try {
      const kv = env.FLIGHT_CACHE;
      if (!kv) {
        return json({ error: "misconfigured", message: "FLIGHT_CACHE binding missing" }, 500);
      }

      const resolved = await resolveCandidates({
        kv,
        key,
        pin,
        nowMs: Date.now(),
        freshTtlSec: cacheTtl,
        emptyFreshTtlSec: emptyCacheTtl,
        staleTtlSec: staleTtl,
        fetchFresh: () => fetchFreshCandidates(parsed, env),
      });

      const body = packedResponse(
        parsed,
        resolved.candidates,
        packSize,
        cacheTtl,
        {
          stale: resolved.stale,
          ageSeconds: resolved.ageSeconds,
          enrich: resolved.enrich,
        },
      );
      return json(body, 200, {
        "Cache-Control": "no-store",
      });
    } catch (err) {
      return json(
        { error: "upstream_failed", message: String(err?.message || err) },
        502,
      );
    }
  },
};

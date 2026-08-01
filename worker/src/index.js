import { authorize, parseFlightsQuery } from "./auth.js";
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

    const cacheTtl = Number(env.CACHE_TTL_SECONDS || 300);
    const cacheKey = new Request(
      `https://airplane-frame.cache/flights?lat=${parsed.lat}&lon=${parsed.lon}&r=${parsed.radiusNm}`,
      request,
    );
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
      const aircraft = await fetchAirplanesLive(parsed.lat, parsed.lon, parsed.radiusNm);
      const maxEnrich = Number(env.MAX_ENRICH || 12);
      const maxResults = Number(env.MAX_RESULTS || 20);
      const flights = (
        await enrichAircraftList(aircraft, {
          airlabsKey: env.AIRLABS_API_KEY,
          maxEnrich,
        })
      ).slice(0, maxResults);

      const body = {
        pin: {
          lat: parsed.lat,
          lon: parsed.lon,
          radiusMi: parsed.radiusMi,
          radiusNm: parsed.radiusNm,
        },
        count: flights.length,
        flights,
        cachedForSeconds: cacheTtl,
      };
      const response = json(body, 200, {
        "Cache-Control": `public, max-age=${cacheTtl}`,
      });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (err) {
      return json({ error: "upstream_failed", message: String(err?.message || err) }, 502);
    }
  },
};

/** @param {Request} request @param {string} sharedSecret */
export function authorize(request, sharedSecret) {
  if (!sharedSecret) return false;
  const header = request.headers.get("Authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  return timingSafeEqual(match[1], sharedSecret);
}

/** Constant-time string compare for equal-length secrets; length mismatch fails closed. */
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let out = 0;
  for (let i = 0; i < aa.length; i++) out |= aa[i] ^ bb[i];
  return out === 0;
}

/** Statute miles → nautical miles for airplanes.live radius. */
export function milesToNm(radiusMi) {
  const n = Number(radiusMi);
  if (!Number.isFinite(n) || n <= 0) return 25;
  return Math.min(250, Math.max(1, Math.round(n * 0.868976)));
}

import { parseTokenList } from "./pack.js";

export function parseFlightsQuery(url) {
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const radiusMi = Number(url.searchParams.get("radiusMi") || "25");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { error: "lat and lon are required numbers" };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { error: "lat/lon out of range" };
  }

  const minAltitudeRaw = url.searchParams.get("minAltitudeFt");
  let minAltitudeFt = 0;
  if (minAltitudeRaw != null && minAltitudeRaw !== "") {
    minAltitudeFt = Number(minAltitudeRaw);
    if (!Number.isFinite(minAltitudeFt) || minAltitudeFt < 0) {
      return { error: "minAltitudeFt must be a non-negative number" };
    }
  }

  const carrierAllow = parseTokenList(url.searchParams.get("carrierAllow"));
  const carrierDeny = parseTokenList(url.searchParams.get("carrierDeny"));

  const destGroupRaw = (url.searchParams.get("destGroup") || "").trim().toLowerCase();
  const destGroupModeRaw = (url.searchParams.get("destGroupMode") || "")
    .trim()
    .toLowerCase();
  let destGroup = null;
  let destGroupMode = null;
  if (destGroupRaw || destGroupModeRaw) {
    if (!destGroupRaw) {
      return { error: "destGroup is required when destGroupMode is set" };
    }
    if (!destGroupModeRaw) {
      return { error: "destGroupMode is required when destGroup is set" };
    }
    if (destGroupRaw !== "nyc") {
      return { error: "unknown destGroup (supported: nyc)" };
    }
    if (destGroupModeRaw !== "prefer" && destGroupModeRaw !== "exclude") {
      return { error: "destGroupMode must be prefer or exclude" };
    }
    destGroup = destGroupRaw;
    destGroupMode = destGroupModeRaw;
  }

  const uniqueRaw = url.searchParams.get("unique");
  const unique = uniqueRaw == null || uniqueRaw === "" || uniqueRaw === "1"
    ? true
    : uniqueRaw === "0"
      ? false
      : null;
  if (unique === null) {
    return { error: "unique must be 0 or 1" };
  }

  const sortByDistanceRaw = url.searchParams.get("sortByDistance");
  const sortByDistance =
    sortByDistanceRaw == null || sortByDistanceRaw === "" || sortByDistanceRaw === "0"
      ? false
      : sortByDistanceRaw === "1"
        ? true
        : null;
  if (sortByDistance === null) {
    return { error: "sortByDistance must be 0 or 1" };
  }

  return {
    lat,
    lon,
    radiusMi,
    radiusNm: milesToNm(radiusMi),
    minAltitudeFt,
    carrierAllow,
    carrierDeny,
    destGroup,
    destGroupMode,
    unique,
    sortByDistance,
  };
}

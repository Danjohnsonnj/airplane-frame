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
  return { lat, lon, radiusMi, radiusNm: milesToNm(radiusMi) };
}

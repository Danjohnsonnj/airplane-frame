/** Shared front-end defaults. No secrets here. */

/** Production API via Cloudflare Tunnel → Pi (Phase 6.5). */
export const PROD_API_BASE = "https://api.danjnj.com";

/** Legacy Cloudflare Worker — explicit rollback only (`?worker=cloudflare`). */
export const CLOUDFLARE_WORKER_BASE =
  "https://airplane-frame.danjohnsonnj.workers.dev";

export const LOCAL_WORKER_BASE = "http://127.0.0.1:8788";

/** @deprecated Prefer PROD_API_BASE — kept for older imports/tests during transition */
export const PROD_WORKER_BASE = PROD_API_BASE;

/** @deprecated Use resolveWorkerBase — kept for imports during transition */
export const WORKER_BASE = PROD_API_BASE;

export const JC_DEFAULT = { lat: 40.728, lon: -74.078 };

export const SWATCH_ORDER = [
  "ground-sun",
  "ground-navy",
  "ground-rose",
  "ground-teal",
  "ground-coral",
  "ground-mint",
];

export const DEFAULTS = {
  radiusMi: 25,
  autoRefresh: false,
  refreshSeconds: 300,
  minAltitudeFt: 5000,
  carrierAllow: "",
  carrierDeny: "",
  destGroup: "",
  destGroupMode: "",
  unique: true,
};

export const STORAGE_KEYS = {
  secret: "af_secret",
  lat: "af_lat",
  lon: "af_lon",
  radiusMi: "af_radiusMi",
  autoRefresh: "af_autoRefresh",
  refreshSeconds: "af_refreshSeconds",
  minAltitudeFt: "af_minAltitudeFt",
  carrierAllow: "af_carrierAllow",
  carrierDeny: "af_carrierDeny",
  destGroup: "af_destGroup",
  destGroupMode: "af_destGroupMode",
  unique: "af_unique",
  viewSticky: "af_viewSticky",
};

/**
 * True when the page is served from local dev (loopback or private LAN).
 * @param {string} hostname
 */
export function isLocalDevHost(hostname) {
  if (!hostname) return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.startsWith("10.")) return true;
  if (hostname.startsWith("192.168.")) return true;
  const parts = hostname.split(".");
  if (parts.length === 4 && parts[0] === "172") {
    const second = Number(parts[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

/**
 * Pick API base URL from page location.
 * @param {{ hostname?: string, search?: string } | Location | URL} loc
 */
export function resolveWorkerBase(loc) {
  const hostname = loc?.hostname || "";
  const search = loc?.search || "";
  const params = new URLSearchParams(search);
  // Explicit rollback to shared-egress Cloudflare Worker (never silent failover).
  if (params.get("worker") === "cloudflare") return CLOUDFLARE_WORKER_BASE;
  // Force production Pi API from a local/LAN page.
  if (params.get("worker") === "prod") return PROD_API_BASE;
  if (!isLocalDevHost(hostname)) return PROD_API_BASE;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_WORKER_BASE;
  }
  return `http://${hostname}:8788`;
}

/** Human label for status line — local vs production backends. */
export function workerBackendLabel(base) {
  const str = String(base);
  if (str === LOCAL_WORKER_BASE || str.includes("127.0.0.1:8788")) {
    return "local Worker";
  }
  try {
    const url = new URL(str);
    if (url.port === "8788" && isLocalDevHost(url.hostname)) {
      return "local Worker";
    }
    if (str === CLOUDFLARE_WORKER_BASE || url.hostname.endsWith(".workers.dev")) {
      return "Cloudflare Worker (rollback)";
    }
  } catch {
    // not a URL
  }
  if (str === PROD_API_BASE || str.includes("api.danjnj.com")) {
    return "production API (Pi)";
  }
  return "production API";
}

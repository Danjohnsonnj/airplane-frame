/** Shared front-end defaults. No secrets here. */
export const PROD_WORKER_BASE = "https://airplane-frame.danjohnsonnj.workers.dev";
export const LOCAL_WORKER_BASE = "http://127.0.0.1:8788";

/** @deprecated Use resolveWorkerBase — kept for imports during transition */
export const WORKER_BASE = PROD_WORKER_BASE;

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
 * Pick Worker base URL from page location.
 * @param {{ hostname?: string, search?: string } | Location | URL} loc
 */
export function resolveWorkerBase(loc) {
  const hostname = loc?.hostname || "";
  const search = loc?.search || "";
  const params = new URLSearchParams(search);
  if (params.get("worker") === "prod") return PROD_WORKER_BASE;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_WORKER_BASE;
  }
  return PROD_WORKER_BASE;
}

/** Human label for status line — local vs production backend. */
export function workerBackendLabel(base) {
  if (base === LOCAL_WORKER_BASE || String(base).includes("127.0.0.1:8788")) {
    return "local Worker";
  }
  return "production Worker";
}

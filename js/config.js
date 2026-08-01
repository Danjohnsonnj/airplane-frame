/** Shared front-end defaults. No secrets here. */
export const WORKER_BASE = "https://airplane-frame.danjohnsonnj.workers.dev";

export const JC_DEFAULT = { lat: 40.728, lon: -74.078 };

export const DEFAULTS = {
  radiusMi: 25,
  refreshSeconds: 300,
  minAltitudeFt: 5000,
};

export const STORAGE_KEYS = {
  secret: "af_secret",
  lat: "af_lat",
  lon: "af_lon",
  radiusMi: "af_radiusMi",
  refreshSeconds: "af_refreshSeconds",
  minAltitudeFt: "af_minAltitudeFt",
};

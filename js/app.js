import {
  DEFAULTS,
  JC_DEFAULT,
  resolveWorkerBase,
  STORAGE_KEYS,
  workerBackendLabel,
} from "./config.js";
import {
  buildFlightsUrl,
  formatPackStatus,
  guardFlights,
  parseStoredBool,
  parseStoredNumber,
  pickGeocodeResult,
  unauthorizedStatusMessage,
} from "./lib.js";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

const els = {
  form: document.getElementById("settings-form"),
  secret: document.getElementById("secret"),
  radiusMi: document.getElementById("radiusMi"),
  refreshSeconds: document.getElementById("refreshSeconds"),
  minAltitudeFt: document.getElementById("minAltitudeFt"),
  carrierAllow: document.getElementById("carrierAllow"),
  carrierDeny: document.getElementById("carrierDeny"),
  destGroupPreset: document.getElementById("destGroupPreset"),
  unique: document.getElementById("unique"),
  refreshBtn: document.getElementById("refresh-btn"),
  searchForm: document.getElementById("search-form"),
  placeQuery: document.getElementById("place-query"),
  placeLabel: document.getElementById("place-label"),
  geoBtn: document.getElementById("geo-btn"),
  lat: document.getElementById("lat"),
  lon: document.getElementById("lon"),
  applyCoordsBtn: document.getElementById("apply-coords-btn"),
  map: document.getElementById("map"),
  status: document.getElementById("status"),
  list: document.getElementById("flight-list"),
};

let map;
let marker;
let refreshTimer = null;
let lastUpdated = null;
const workerBase = resolveWorkerBase(window.location);

function destPresetFromParts(group, mode) {
  if (group === "nyc" && (mode === "prefer" || mode === "exclude")) {
    return `nyc:${mode}`;
  }
  return "";
}

function partsFromDestPreset(preset) {
  if (preset === "nyc:prefer") return { destGroup: "nyc", destGroupMode: "prefer" };
  if (preset === "nyc:exclude") return { destGroup: "nyc", destGroupMode: "exclude" };
  return { destGroup: "", destGroupMode: "" };
}

function loadSettings() {
  const lat = parseStoredNumber(localStorage.getItem(STORAGE_KEYS.lat), JC_DEFAULT.lat);
  const lon = parseStoredNumber(localStorage.getItem(STORAGE_KEYS.lon), JC_DEFAULT.lon);
  const destGroup = localStorage.getItem(STORAGE_KEYS.destGroup) || DEFAULTS.destGroup;
  const destGroupMode =
    localStorage.getItem(STORAGE_KEYS.destGroupMode) || DEFAULTS.destGroupMode;
  return {
    secret: localStorage.getItem(STORAGE_KEYS.secret) || "",
    lat,
    lon,
    radiusMi: parseStoredNumber(
      localStorage.getItem(STORAGE_KEYS.radiusMi),
      DEFAULTS.radiusMi,
    ),
    refreshSeconds: parseStoredNumber(
      localStorage.getItem(STORAGE_KEYS.refreshSeconds),
      DEFAULTS.refreshSeconds,
    ),
    minAltitudeFt: parseStoredNumber(
      localStorage.getItem(STORAGE_KEYS.minAltitudeFt),
      DEFAULTS.minAltitudeFt,
    ),
    carrierAllow: localStorage.getItem(STORAGE_KEYS.carrierAllow) ?? DEFAULTS.carrierAllow,
    carrierDeny: localStorage.getItem(STORAGE_KEYS.carrierDeny) ?? DEFAULTS.carrierDeny,
    destGroup,
    destGroupMode,
    unique: parseStoredBool(localStorage.getItem(STORAGE_KEYS.unique), DEFAULTS.unique),
  };
}

/** Persist pin / radius / refresh / filters — not a rejected Bearer. */
function savePrefs(s) {
  localStorage.setItem(STORAGE_KEYS.lat, String(s.lat));
  localStorage.setItem(STORAGE_KEYS.lon, String(s.lon));
  localStorage.setItem(STORAGE_KEYS.radiusMi, String(s.radiusMi));
  localStorage.setItem(STORAGE_KEYS.refreshSeconds, String(s.refreshSeconds));
  localStorage.setItem(STORAGE_KEYS.minAltitudeFt, String(s.minAltitudeFt));
  localStorage.setItem(STORAGE_KEYS.carrierAllow, s.carrierAllow || "");
  localStorage.setItem(STORAGE_KEYS.carrierDeny, s.carrierDeny || "");
  localStorage.setItem(STORAGE_KEYS.destGroup, s.destGroup || "");
  localStorage.setItem(STORAGE_KEYS.destGroupMode, s.destGroupMode || "");
  localStorage.setItem(STORAGE_KEYS.unique, s.unique ? "1" : "0");
}

function saveSecret(secret) {
  localStorage.setItem(STORAGE_KEYS.secret, secret);
}

function clearStoredSecret() {
  localStorage.removeItem(STORAGE_KEYS.secret);
}

function saveAll(s) {
  savePrefs(s);
  if (s.secret) saveSecret(s.secret);
  else clearStoredSecret();
}

function readFormSettings() {
  const { destGroup, destGroupMode } = partsFromDestPreset(els.destGroupPreset.value);
  return {
    secret: els.secret.value.trim(),
    lat: parseStoredNumber(els.lat.value, JC_DEFAULT.lat),
    lon: parseStoredNumber(els.lon.value, JC_DEFAULT.lon),
    radiusMi: parseStoredNumber(els.radiusMi.value, DEFAULTS.radiusMi),
    refreshSeconds: parseStoredNumber(els.refreshSeconds.value, DEFAULTS.refreshSeconds),
    minAltitudeFt: parseStoredNumber(els.minAltitudeFt.value, DEFAULTS.minAltitudeFt),
    carrierAllow: els.carrierAllow.value.trim(),
    carrierDeny: els.carrierDeny.value.trim(),
    destGroup,
    destGroupMode,
    unique: els.unique.checked,
  };
}

function fillForm(s) {
  els.secret.value = s.secret;
  els.radiusMi.value = String(s.radiusMi);
  els.refreshSeconds.value = String(s.refreshSeconds);
  els.minAltitudeFt.value = String(s.minAltitudeFt);
  els.carrierAllow.value = s.carrierAllow || "";
  els.carrierDeny.value = s.carrierDeny || "";
  els.destGroupPreset.value = destPresetFromParts(s.destGroup, s.destGroupMode);
  els.unique.checked = Boolean(s.unique);
  els.lat.value = String(s.lat);
  els.lon.value = String(s.lon);
}

function setStatus(message, kind = "") {
  els.status.textContent = message;
  els.status.classList.toggle("is-error", kind === "error");
  els.status.classList.toggle("is-ok", kind === "ok");
}

function setPin(lat, lon, { label = "", save = true } = {}) {
  const s = readFormSettings();
  s.lat = lat;
  s.lon = lon;
  fillForm(s);
  if (save) savePrefs(s);
  if (marker) marker.setLatLng([lat, lon]);
  if (map) map.panTo([lat, lon]);
  if (label) els.placeLabel.textContent = label;
}

function initMap(lat, lon) {
  map = L.map(els.map).setView([lat, lon], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  }).addTo(map);
  marker = L.marker([lat, lon]).addTo(map);
  map.on("click", (e) => {
    setPin(e.latlng.lat, e.latlng.lng, {
      label: `Pin set by map click (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`,
    });
  });
}

function formatDistance(nm) {
  if (nm == null || !Number.isFinite(Number(nm))) return "—";
  const mi = Number(nm) * 1.15078;
  return `${mi.toFixed(1)} mi`;
}

function renderFlights(flights) {
  els.list.replaceChildren();
  if (!flights.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No flights match the current pin, radius, and filters.";
    els.list.append(p);
    return;
  }

  for (const f of flights) {
    const li = document.createElement("li");
    li.className = "flight-card";
    const route =
      f.origin && f.destination ? `${f.origin} → ${f.destination}` : `→ ${f.destination}`;
    li.innerHTML = `
      <div class="title">
        <span class="carrier"></span>
        <span class="flight-id"></span>
      </div>
      <div class="meta">
        <div><span>Route</span> <strong class="route"></strong></div>
        <div><span>Aircraft</span> <strong class="plane"></strong></div>
        <div><span>Altitude</span> <strong class="alt"></strong>
          · <span>Distance</span> <strong class="dist"></strong></div>
      </div>
    `;
    li.querySelector(".carrier").textContent = f.carrier;
    li.querySelector(".flight-id").textContent = f.flight || "";
    li.querySelector(".route").textContent = route;
    li.querySelector(".plane").textContent = f.planeType;
    li.querySelector(".alt").textContent = `${Number(f.altitudeFt).toLocaleString()} ft`;
    li.querySelector(".dist").textContent = formatDistance(f.distanceNm);
    els.list.append(li);
  }
}

function pauseRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function handleUnauthorized() {
  clearStoredSecret();
  pauseRefresh();
  setStatus(unauthorizedStatusMessage(), "error");
  renderFlights([]);
}

async function fetchFlights() {
  const s = readFormSettings();
  if (!s.secret) {
    setStatus("APP_SHARED_SECRET required (worker/.dev.vars — not AIRLABS_API_KEY).", "error");
    pauseRefresh();
    return;
  }
  savePrefs(s);
  setStatus("Loading flights…");
  const url = buildFlightsUrl(workerBase, {
    lat: s.lat,
    lon: s.lon,
    radiusMi: s.radiusMi,
    minAltitudeFt: s.minAltitudeFt,
    carrierAllow: s.carrierAllow,
    carrierDeny: s.carrierDeny,
    destGroup: s.destGroup,
    destGroupMode: s.destGroupMode,
    unique: s.unique,
  });

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${s.secret}` },
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.error) detail = errBody.message || errBody.error;
      } catch {
        /* ignore */
      }
      setStatus(`Request failed: ${detail}`, "error");
      renderFlights([]);
      return;
    }
    saveSecret(s.secret);
    const body = await res.json();
    const flights = guardFlights(body.flights || []);
    lastUpdated = new Date();
    const time = lastUpdated.toLocaleTimeString();
    const packSize = body.pack?.size;
    setStatus(
      `${formatPackStatus({
        shown: flights.length,
        packMax: packSize,
        candidateCount: body.candidateCount,
        stale: body.stale,
        ageSeconds: body.ageSeconds,
        updatedLabel: time,
      })} · ${workerBackendLabel(workerBase)}`,
      "ok",
    );
    renderFlights(flights);
  } catch (err) {
    setStatus(`Network error: ${err?.message || err}`, "error");
    renderFlights([]);
  }
}

function scheduleRefresh() {
  pauseRefresh();
  const seconds = Math.max(30, readFormSettings().refreshSeconds);
  refreshTimer = setInterval(() => {
    fetchFlights();
  }, seconds * 1000);
}

async function searchPlace(query) {
  const q = query.trim();
  if (!q) {
    setStatus("Enter a place name to search.", "error");
    return;
  }
  setStatus("Searching place…");
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("name", q);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const picked = pickGeocodeResult(await res.json());
    if (!picked) {
      setStatus("No place found.", "error");
      return;
    }
    const label = [picked.name, picked.admin1, picked.country].filter(Boolean).join(", ");
    setPin(picked.lat, picked.lon, { label });
    setStatus(`Pin set to ${label}`, "ok");
  } catch (err) {
    setStatus(`Geocode failed: ${err?.message || err}`, "error");
  }
}

function useGeolocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation not supported in this browser.", "error");
    return;
  }
  setStatus("Requesting device location…");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      setPin(latitude, longitude, {
        label: `Device location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      });
      setStatus("Pin set from device location.", "ok");
    },
    (err) => {
      setStatus(`Geolocation denied or failed: ${err.message}`, "error");
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
  );
}

function boot() {
  const s = loadSettings();
  fillForm(s);
  initMap(s.lat, s.lon);
  els.placeLabel.textContent = "Default pin: Jersey City, NJ (adjust via search, map, or GPS).";

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const next = readFormSettings();
    saveAll(next);
    scheduleRefresh();
    setStatus("Settings saved.", "ok");
  });

  els.refreshBtn.addEventListener("click", () => {
    fetchFlights();
  });

  els.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    searchPlace(els.placeQuery.value);
  });

  els.geoBtn.addEventListener("click", () => useGeolocation());

  els.applyCoordsBtn.addEventListener("click", () => {
    const lat = parseStoredNumber(els.lat.value, NaN);
    const lon = parseStoredNumber(els.lon.value, NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setStatus("Lat and lon must be numbers.", "error");
      return;
    }
    setPin(lat, lon, {
      label: `Pin set from coords (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    });
  });

  if (s.secret) {
    scheduleRefresh();
    fetchFlights();
  }
}

boot();

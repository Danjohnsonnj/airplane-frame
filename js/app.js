import {
  DEFAULTS,
  JC_DEFAULT,
  resolveWorkerBase,
  STORAGE_KEYS,
  SWATCH_ORDER,
  workerBackendLabel,
} from "./config.js";
import { CARRIER_BRAND_NAMES } from "./carrier-brands.js";
import {
  assignPaperSlot,
  assignPanelGrounds,
  buildFlightsUrl,
  buildPosterStatusCopy,
  friendlyFetchErrorMessage,
  formatDistanceNm,
  formatPackStatus,
  formatRoute,
  formatCityRoute,
  guardFlights,
  parseStoredBool,
  parseStoredNumber,
  pickGeocodeResult,
  posterStatusKind,
  resolveWallMode,
  unauthorizedStatusMessage,
} from "./lib.js";
import { resolvePlaneAsset } from "./plane-asset.js";
import { initSilhouetteMotion } from "./silhouette-motion.js";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const LANDSCAPE_MQ = window.matchMedia("(orientation: landscape)");

const els = {
  viewPoster: document.getElementById("view-poster"),
  viewSettings: document.getElementById("view-settings"),
  posterWall: document.getElementById("poster-wall"),
  posterSettingsBtn: document.getElementById("poster-settings-btn"),
  posterReturnBtn: document.getElementById("poster-return-btn"),
  form: document.getElementById("settings-form"),
  secret: document.getElementById("secret"),
  radiusMi: document.getElementById("radiusMi"),
  autoRefresh: document.getElementById("autoRefresh"),
  refreshSeconds: document.getElementById("refreshSeconds"),
  minAltitudeFt: document.getElementById("minAltitudeFt"),
  carrierAllow: document.getElementById("carrierAllow"),
  carrierDeny: document.getElementById("carrierDeny"),
  destGroupPreset: document.getElementById("destGroupPreset"),
  unique: document.getElementById("unique"),
  sortByDistance: document.getElementById("sortByDistance"),
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
let bootFetchSucceeded = false;
let allowDefaultRouteToPoster = false;
let lastPosterFlights = [];
let lastPosterMeta = {};
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
    autoRefresh: parseStoredBool(
      localStorage.getItem(STORAGE_KEYS.autoRefresh),
      DEFAULTS.autoRefresh,
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
    sortByDistance: parseStoredBool(
      localStorage.getItem(STORAGE_KEYS.sortByDistance),
      DEFAULTS.sortByDistance,
    ),
  };
}

function savePrefs(s) {
  localStorage.setItem(STORAGE_KEYS.lat, String(s.lat));
  localStorage.setItem(STORAGE_KEYS.lon, String(s.lon));
  localStorage.setItem(STORAGE_KEYS.radiusMi, String(s.radiusMi));
  localStorage.setItem(STORAGE_KEYS.refreshSeconds, String(s.refreshSeconds));
  localStorage.setItem(STORAGE_KEYS.autoRefresh, s.autoRefresh ? "1" : "0");
  localStorage.setItem(STORAGE_KEYS.minAltitudeFt, String(s.minAltitudeFt));
  localStorage.setItem(STORAGE_KEYS.carrierAllow, s.carrierAllow || "");
  localStorage.setItem(STORAGE_KEYS.carrierDeny, s.carrierDeny || "");
  localStorage.setItem(STORAGE_KEYS.destGroup, s.destGroup || "");
  localStorage.setItem(STORAGE_KEYS.destGroupMode, s.destGroupMode || "");
  localStorage.setItem(STORAGE_KEYS.unique, s.unique ? "1" : "0");
  localStorage.setItem(STORAGE_KEYS.sortByDistance, s.sortByDistance ? "1" : "0");
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
    autoRefresh: els.autoRefresh.checked,
    minAltitudeFt: parseStoredNumber(els.minAltitudeFt.value, DEFAULTS.minAltitudeFt),
    carrierAllow: els.carrierAllow.value.trim(),
    carrierDeny: els.carrierDeny.value.trim(),
    destGroup,
    destGroupMode,
    unique: els.unique.checked,
    sortByDistance: els.sortByDistance.checked,
  };
}

function fillForm(s) {
  els.secret.value = s.secret;
  els.radiusMi.value = String(s.radiusMi);
  els.autoRefresh.checked = Boolean(s.autoRefresh);
  els.refreshSeconds.value = String(s.refreshSeconds);
  els.minAltitudeFt.value = String(s.minAltitudeFt);
  els.carrierAllow.value = s.carrierAllow || "";
  els.carrierDeny.value = s.carrierDeny || "";
  els.destGroupPreset.value = destPresetFromParts(s.destGroup, s.destGroupMode);
  els.unique.checked = Boolean(s.unique);
  els.sortByDistance.checked = Boolean(s.sortByDistance);
  els.lat.value = String(s.lat);
  els.lon.value = String(s.lon);
  syncRefreshIntervalEnabled();
}

function syncRefreshIntervalEnabled() {
  els.refreshSeconds.disabled = !els.autoRefresh.checked;
}

function setStatus(message, kind = "") {
  els.status.textContent = message;
  els.status.classList.toggle("is-error", kind === "error");
  els.status.classList.toggle("is-ok", kind === "ok");
}

function getStickyView() {
  const raw = localStorage.getItem(STORAGE_KEYS.viewSticky);
  if (raw === "poster" || raw === "settings") return raw;
  return "";
}

function setStickyView(view) {
  if (view === "poster" || view === "settings") {
    localStorage.setItem(STORAGE_KEYS.viewSticky, view);
  } else {
    localStorage.removeItem(STORAGE_KEYS.viewSticky);
  }
}

function parseViewQuery() {
  const v = new URLSearchParams(window.location.search).get("view");
  if (v === "poster" || v === "settings") return v;
  return "";
}

function showView(view) {
  const isPoster = view === "poster";
  els.viewPoster.hidden = !isPoster;
  els.viewSettings.hidden = isPoster;
  document.body.classList.toggle("view-poster-active", isPoster);
  if (isPoster) syncWallMode();
}

function navigateToPoster({ sticky = true } = {}) {
  if (sticky) setStickyView("poster");
  showView("poster");
}

function navigateToSettings({ sticky = true } = {}) {
  if (sticky) setStickyView("settings");
  showView("settings");
}

function maybeDefaultRouteToPoster() {
  if (!allowDefaultRouteToPoster) return;
  if (getStickyView() || parseViewQuery()) return;
  if (bootFetchSucceeded) navigateToPoster({ sticky: false });
}

function syncWallMode() {
  const mode = resolveWallMode({
    orientation: LANDSCAPE_MQ.matches ? "landscape" : "portrait",
    width: window.innerWidth,
  });
  els.posterWall.classList.toggle("rows", mode === "rows");
  els.posterWall.classList.toggle("columns", mode === "columns");
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

function formatDistanceMi(nm) {
  if (nm == null || !Number.isFinite(Number(nm))) return "—";
  const mi = Number(nm) * 1.15078;
  return `${mi.toFixed(1)} mi`;
}

function renderSettingsFlights(flights) {
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
    const route = formatRoute(f.origin, f.destination);
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
    li.querySelector(".dist").textContent = formatDistanceMi(f.distanceNm);
    els.list.append(li);
  }
}

function createField(label, value) {
  const field = document.createElement("span");
  field.className = "field";
  const lbl = document.createElement("b");
  lbl.className = "field-label";
  lbl.textContent = label;
  const val = document.createElement("span");
  val.className = "field-value";
  val.textContent = value;
  field.append(lbl, val);
  return field;
}

/** @type {Promise<{ manifest: { icao?: string[] }, familyMap: Record<string, string> }> | null} */
let planeMapsPromise = null;

function loadPlaneMaps() {
  if (!planeMapsPromise) {
    planeMapsPromise = Promise.all([
      fetch("assets/planes/manifest.json").then((r) => {
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        return r.json();
      }),
      fetch("assets/planes/family-map.json").then((r) => {
        if (!r.ok) throw new Error(`family-map ${r.status}`);
        return r.json();
      }),
    ]).then(([manifest, familyMap]) => ({ manifest, familyMap }));
  }
  return planeMapsPromise;
}

async function fillPlaneSilhouette(host, icaoType) {
  try {
    const { manifest, familyMap } = await loadPlaneMaps();
    const resolved = resolvePlaneAsset(icaoType, manifest, familyMap);
    const res = await fetch(resolved.href);
    if (!res.ok) throw new Error(`${resolved.href} ${res.status}`);
    const svgText = await res.text();
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) throw new Error(`No svg root in ${resolved.href}`);
    host.replaceChildren(document.importNode(svg, true));
    host.dataset.tier = resolved.tier;
  } catch (err) {
    console.warn("[plane-silhouette]", icaoType, err);
  }
}

function createFlightPanel(f, ground, index, wallMode) {
  const article = document.createElement("article");
  article.className = "flight-panel";
  if (ground.dataCarrier) article.dataset.carrier = ground.dataCarrier;
  if (ground.groundClass) article.classList.add(ground.groundClass);
  article.style.setProperty("--delay", `${40 + index * 60}ms`);

  const slot = assignPaperSlot(index);
  const paper = document.createElement("img");
  paper.className = "paper-surface";
  paper.src = "assets/textures/paper-texture-size-medium.jpg";
  paper.alt = "";
  paper.setAttribute("aria-hidden", "true");
  paper.dataset.paperSlot = String(slot);
  paper.dataset.warp = String(slot);

  const wear = document.createElement("div");
  wear.className = "paper-wear-layer";
  wear.setAttribute("aria-hidden", "true");

  const hero = document.createElement("div");
  hero.className = "hero";
  const silhouette = document.createElement("div");
  silhouette.className = `plane-silhouette ${wallMode === "columns" ? "cols-motion" : "rows-motion"}`;
  silhouette.setAttribute("aria-hidden", "true");
  const icao = f.icaoType == null ? "" : String(f.icaoType);
  if (icao) silhouette.dataset.icao = icao;
  const airline = document.createElement("h3");
  airline.className = "airline";
  airline.textContent = f.carrier;
  const flightNo = document.createElement("span");
  flightNo.className = "flight-number";
  flightNo.textContent = f.flight || "";
  hero.append(silhouette, airline, flightNo);

  const tag = document.createElement("div");
  tag.className = wallMode === "columns" ? "tag vertical-tag" : "tag horizontal-tag";

  const codeWrap = document.createElement("div");
  codeWrap.className = "tag-code-wrap";
  const kicker = document.createElement("span");
  kicker.className = "tag-kicker";
  kicker.textContent = "Destination";
  const code = document.createElement("strong");
  code.className = "tag-code";
  code.textContent = f.destination;
  codeWrap.append(kicker, code);

  const fields = document.createElement("div");
  fields.className = "tag-fields";
  fields.append(
    createField(
      "Route",
      formatCityRoute(f.origin, f.originCity, f.destination, f.destinationCity),
    ),
    createField("Aircraft", f.planeType),
    createField("Altitude", `${Number(f.altitudeFt).toLocaleString()} ft`),
    createField("Distance", formatDistanceNm(f.distanceNm)),
  );

  tag.append(codeWrap, fields);
  article.append(paper, wear, hero, tag);
  article._silhouetteFill = fillPlaneSilhouette(silhouette, f.icaoType);
  return article;
}

function createStatusPanel(copy, { error = false } = {}) {
  const article = document.createElement("article");
  article.className = "status-panel";
  if (error) article.classList.add("error");
  article.setAttribute("aria-label", `Flight status: ${copy.word}`);

  const hero = document.createElement("div");
  hero.className = "status-hero";
  const title = document.createElement("h2");
  title.innerHTML = "Nearby<br>flights";
  hero.append(title);

  const tag = document.createElement("div");
  tag.className = "status-tag";
  const word = document.createElement("strong");
  word.className = "status-word";
  word.textContent = copy.word;

  const fieldsWrap = document.createElement("div");
  fieldsWrap.className = "status-fields";

  const rows = [
    ["Status", copy.status],
    ["Detail", copy.detail],
    ["Action", copy.action, true],
    ["Updated", copy.updated],
  ];
  for (const [label, value, isAction] of rows) {
    const row = document.createElement("div");
    row.className = "status-row";
    if (isAction) row.classList.add("action");
    const lbl = document.createElement("b");
    lbl.className = "field-label";
    lbl.textContent = label;
    const val = document.createElement("span");
    val.className = "field-value";
    val.textContent = value;
    row.append(lbl, val);
    fieldsWrap.append(row);
  }

  tag.append(word, fieldsWrap);
  article.append(hero, tag);
  return article;
}

function renderPosterWall(flights, meta = {}) {
  const wallMode = resolveWallMode({
    orientation: LANDSCAPE_MQ.matches ? "landscape" : "portrait",
    width: window.innerWidth,
  });
  const kind = posterStatusKind({
    flightsLength: flights.length,
    httpError: meta.httpError,
    networkError: meta.networkError,
    stale: meta.stale,
    loading: meta.loading,
  });

  const settingsBtn = els.posterSettingsBtn;
  els.posterWall.replaceChildren(settingsBtn);

  if (kind === "ok") {
    void loadPlaneMaps();
    const grounds = assignPanelGrounds(flights, CARRIER_BRAND_NAMES, SWATCH_ORDER);
    const silhouetteFills = [];
    for (let i = 0; i < flights.length; i += 1) {
      const panel = createFlightPanel(flights[i], grounds[i], i, wallMode);
      silhouetteFills.push(panel._silhouetteFill);
      els.posterWall.append(panel);
    }
    void Promise.all(silhouetteFills).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => initSilhouetteMotion(els.viewPoster, els.posterWall, wallMode));
      });
    });
    lastPosterFlights = flights;
    lastPosterMeta = { ...meta, stale: meta.stale };
    return;
  }

  lastPosterFlights = [];
  lastPosterMeta = { ...meta };

  const copy = buildPosterStatusCopy(kind, {
    radiusMi: meta.radiusMi,
    updatedLabel: meta.updatedLabel,
    errorDetail: meta.errorDetail,
    unauthorized: meta.unauthorized,
  });
  els.posterWall.append(createStatusPanel(copy, { error: kind === "err" }));
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
  renderSettingsFlights([]);
  renderPosterWall([], {
    httpError: true,
    unauthorized: true,
    updatedLabel: lastUpdated ? lastUpdated.toLocaleTimeString() : "—",
    radiusMi: readFormSettings().radiusMi,
  });
  navigateToSettings({ sticky: false });
}

async function fetchFlights({ boot = false } = {}) {
  const s = readFormSettings();
  if (!s.secret) {
    setStatus("APP_SHARED_SECRET required (worker/.dev.vars — not AIRLABS_API_KEY).", "error");
    pauseRefresh();
    renderPosterWall([], {
      httpError: true,
      errorDetail: "APP_SHARED_SECRET required.",
      radiusMi: s.radiusMi,
    });
    return false;
  }

  savePrefs(s);
  setStatus("Loading flights…");
  renderPosterWall([], { loading: true, radiusMi: s.radiusMi });

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
    sortByDistance: s.sortByDistance,
  });

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${s.secret}` },
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
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
      renderSettingsFlights([]);
      renderPosterWall([], {
        httpError: true,
        errorDetail: detail,
        radiusMi: s.radiusMi,
        updatedLabel: lastUpdated ? lastUpdated.toLocaleTimeString() : "—",
      });
      return false;
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

    renderSettingsFlights(flights);
    renderPosterWall(flights, {
      stale: body.stale,
      radiusMi: s.radiusMi,
      updatedLabel: time,
    });

    if (boot) {
      bootFetchSucceeded = true;
      maybeDefaultRouteToPoster();
    }
    return true;
  } catch (err) {
    const detail = friendlyFetchErrorMessage(err, workerBase);
    setStatus(`Network error: ${detail}`, "error");
    renderSettingsFlights([]);
    renderPosterWall([], {
      networkError: true,
      errorDetail: detail,
      radiusMi: s.radiusMi,
      updatedLabel: lastUpdated ? lastUpdated.toLocaleTimeString() : "—",
    });
    return false;
  }
}

function scheduleRefresh() {
  pauseRefresh();
  const s = readFormSettings();
  if (!s.autoRefresh) return;
  const seconds = Math.max(30, s.refreshSeconds);
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

function initRouting() {
  const queryView = parseViewQuery();
  if (queryView) {
    setStickyView(queryView);
    showView(queryView);
    return;
  }

  const sticky = getStickyView();
  if (sticky) {
    showView(sticky);
    return;
  }

  allowDefaultRouteToPoster = true;
  showView("settings");
}

async function boot() {
  const s = loadSettings();
  fillForm(s);
  initMap(s.lat, s.lon);
  els.placeLabel.textContent = "Default pin: Jersey City, NJ (adjust via search, map, or GPS).";
  initRouting();
  syncWallMode();

  LANDSCAPE_MQ.addEventListener("change", () => {
    syncWallMode();
    if (!els.viewPoster.hidden && lastPosterFlights.length) {
      renderPosterWall(lastPosterFlights, lastPosterMeta);
    }
  });

  window.addEventListener("resize", syncWallMode);

  els.posterSettingsBtn.addEventListener("click", () => {
    navigateToSettings({ sticky: true });
  });

  els.posterReturnBtn.addEventListener("click", () => {
    navigateToPoster({ sticky: true });
  });

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const next = readFormSettings();
    saveAll(next);
    scheduleRefresh();
    setStatus("Settings saved.", "ok");
  });

  els.autoRefresh.addEventListener("change", () => {
    syncRefreshIntervalEnabled();
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
    const bootFetch = allowDefaultRouteToPoster;
    await fetchFlights({ boot: bootFetch });
  } else if (!els.viewPoster.hidden) {
    renderPosterWall([], {
      httpError: true,
      errorDetail: "APP_SHARED_SECRET required.",
      radiusMi: s.radiusMi,
    });
  }
}

boot();

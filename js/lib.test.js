import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignPaperSlot,
  assignPanelGrounds,
  buildFlightsUrl,
  buildPosterStatusCopy,
  filterFlights,
  friendlyFetchErrorMessage,
  formatDistanceNm,
  formatPackStatus,
  formatRoute,
  isCompleteFlight,
  parseStoredNumber,
  pickGeocodeResult,
  posterStatusKind,
  resolveCarrierBrand,
  resolveWallMode,
  unauthorizedStatusMessage,
} from "./lib.js";
import { CLOUDFLARE_WORKER_BASE, LOCAL_WORKER_BASE, PROD_API_BASE, resolveWorkerBase } from "./config.js";

describe("isCompleteFlight", () => {
  it("requires carrier, destination, and planeType", () => {
    assert.equal(
      isCompleteFlight({
        carrier: "United",
        destination: "ORD",
        planeType: "Boeing 737",
      }),
      true,
    );
    assert.equal(
      isCompleteFlight({ carrier: "", destination: "ORD", planeType: "B737" }),
      false,
    );
    assert.equal(isCompleteFlight(null), false);
  });
});

describe("filterFlights", () => {
  const rows = [
    { carrier: "A", destination: "X", planeType: "B737", altitudeFt: 8000 },
    { carrier: "B", destination: "Y", planeType: "A320", altitudeFt: 3000 },
    { carrier: "C", destination: "Z", planeType: "B787", altitudeFt: 5000 },
    { carrier: "", destination: "Z", planeType: "B787", altitudeFt: 9000 },
  ];

  it("keeps complete flights at or above min altitude", () => {
    const out = filterFlights(rows, 5000);
    assert.equal(out.length, 2);
    assert.deepEqual(
      out.map((f) => f.carrier),
      ["A", "C"],
    );
  });

  it("treats non-array as empty", () => {
    assert.deepEqual(filterFlights(null, 0), []);
  });
});

describe("parseStoredNumber", () => {
  it("falls back when raw is invalid", () => {
    assert.equal(parseStoredNumber("25", 10), 25);
    assert.equal(parseStoredNumber("nope", 10), 10);
    assert.equal(parseStoredNumber(null, 10), 10);
  });
});

describe("buildFlightsUrl", () => {
  it("builds query with lat lon radiusMi", () => {
    const url = buildFlightsUrl("https://example.workers.dev", {
      lat: 40.728,
      lon: -74.078,
      radiusMi: 25,
    });
    assert.equal(
      url,
      "https://example.workers.dev/flights?lat=40.728&lon=-74.078&radiusMi=25",
    );
  });

  it("includes pack filter params", () => {
    const url = buildFlightsUrl("https://example.workers.dev", {
      lat: 40.728,
      lon: -74.078,
      radiusMi: 25,
      minAltitudeFt: 5000,
      carrierAllow: "United",
      carrierDeny: "Spirit",
      destGroup: "nyc",
      destGroupMode: "exclude",
      unique: false,
    });
    const u = new URL(url);
    assert.equal(u.searchParams.get("minAltitudeFt"), "5000");
    assert.equal(u.searchParams.get("carrierAllow"), "United");
    assert.equal(u.searchParams.get("carrierDeny"), "Spirit");
    assert.equal(u.searchParams.get("destGroup"), "nyc");
    assert.equal(u.searchParams.get("destGroupMode"), "exclude");
    assert.equal(u.searchParams.get("unique"), "0");
  });

  it("includes sortByDistance when enabled", () => {
    const url = buildFlightsUrl("https://example.workers.dev", {
      lat: 40.728,
      lon: -74.078,
      radiusMi: 25,
      sortByDistance: true,
    });
    const u = new URL(url);
    assert.equal(u.searchParams.get("sortByDistance"), "1");
  });

  it("omits sortByDistance when disabled", () => {
    const url = buildFlightsUrl("https://example.workers.dev", {
      lat: 40.728,
      lon: -74.078,
      radiusMi: 25,
      sortByDistance: false,
    });
    const u = new URL(url);
    assert.equal(u.searchParams.get("sortByDistance"), null);
  });
});

describe("pickGeocodeResult", () => {
  it("returns first valid lat/lon", () => {
    const picked = pickGeocodeResult({
      results: [{ name: "Jersey City", latitude: 40.72, longitude: -74.07, admin1: "New Jersey", country: "United States" }],
    });
    assert.equal(picked.lat, 40.72);
    assert.equal(picked.lon, -74.07);
    assert.equal(picked.name, "Jersey City");
  });

  it("returns null when empty", () => {
    assert.equal(pickGeocodeResult({ results: [] }), null);
    assert.equal(pickGeocodeResult(null), null);
  });
});

describe("unauthorizedStatusMessage", () => {
  it("names APP_SHARED_SECRET and warns against AIRLABS_API_KEY", () => {
    const msg = unauthorizedStatusMessage();
    assert.match(msg, /APP_SHARED_SECRET/);
    assert.match(msg, /AIRLABS_API_KEY/);
    assert.match(msg, /paused/i);
  });
});

describe("formatPackStatus", () => {
  it("includes pack size, max, candidate total, and updated time", () => {
    assert.equal(
      formatPackStatus({
        shown: 5,
        packMax: 5,
        candidateCount: 50,
        updatedLabel: "7:45:24 AM",
      }),
      "Pack 5 (max 5) · 50 total flights · updated 7:45:24 AM",
    );
  });

  it("omits max and total when missing", () => {
    assert.equal(
      formatPackStatus({ shown: 3, updatedLabel: "8:00:00 AM" }),
      "Pack 3 · updated 8:00:00 AM",
    );
  });

  it("appends stale age label when stale", () => {
    assert.equal(
      formatPackStatus({
        shown: 5,
        packMax: 5,
        candidateCount: 12,
        stale: true,
        ageSeconds: 420,
        updatedLabel: "8:10:02 AM",
      }),
      "Pack 5 (max 5) · 12 total flights · data 7 min old · updated 8:10:02 AM",
    );
  });
});

describe("assignPanelGrounds", () => {
  const brands = new Set(["United Airlines", "Delta Air Lines"]);

  it("uses brand color for duplicate same carrier", () => {
    const flights = [
      { carrier: "United Airlines" },
      { carrier: "United Airlines" },
      { carrier: "Unknown Regional" },
    ];
    const out = assignPanelGrounds(flights, brands);
    assert.equal(out[0].dataCarrier, "United Airlines");
    assert.equal(out[0].groundClass, undefined);
    assert.equal(out[1].dataCarrier, "United Airlines");
    assert.equal(out[1].groundClass, undefined);
    assert.equal(out[2].groundClass, "ground-sun");
  });

  it("assigns unique swatches for unknown carriers", () => {
    const flights = [{ carrier: "Foo" }, { carrier: "Bar" }];
    const out = assignPanelGrounds(flights, brands);
    assert.equal(out[0].groundClass, "ground-sun");
    assert.equal(out[1].groundClass, "ground-navy");
  });

  it("resolves UNITED AIRLINES INC to United Airlines brand", () => {
    const out = assignPanelGrounds([{ carrier: "UNITED AIRLINES INC" }], brands);
    assert.equal(out[0].dataCarrier, "United Airlines");
    assert.equal(out[0].groundClass, undefined);
  });

  it("second United in pack also gets brand when INC already used brand", () => {
    const flights = [
      { carrier: "UNITED AIRLINES INC" },
      { carrier: "United Airlines" },
    ];
    const out = assignPanelGrounds(flights, brands);
    assert.equal(out[0].dataCarrier, "United Airlines");
    assert.equal(out[1].dataCarrier, "United Airlines");
    assert.equal(out[1].groundClass, undefined);
  });

  it("duplicate DELTA AIR LINES INC both get Delta brand color", () => {
    const flights = [
      { carrier: "DELTA AIR LINES INC" },
      { carrier: "DELTA AIR LINES INC" },
    ];
    const out = assignPanelGrounds(flights, brands);
    assert.equal(out[0].dataCarrier, "Delta Air Lines");
    assert.equal(out[1].dataCarrier, "Delta Air Lines");
  });

  it("trustee ownOp gets swatch not brand", () => {
    const out = assignPanelGrounds([{ carrier: "BANK OF UTAH TRUSTEE" }], brands);
    assert.equal(out[0].groundClass, "ground-sun");
    assert.equal(out[0].dataCarrier, undefined);
  });
});

describe("resolveCarrierBrand", () => {
  const brands = new Set(["United Airlines", "Delta Air Lines"]);

  it("maps INC legal name to book string", () => {
    assert.equal(resolveCarrierBrand("UNITED AIRLINES INC", brands), "United Airlines");
  });

  it("case-folds exact brand match", () => {
    assert.equal(resolveCarrierBrand("united airlines", brands), "United Airlines");
  });

  it("returns null for trustee strings", () => {
    assert.equal(resolveCarrierBrand("BANK OF UTAH TRUSTEE", brands), null);
  });
});

describe("friendlyFetchErrorMessage", () => {
  it("hints to start dev-worker when fetch fails", () => {
    const msg = friendlyFetchErrorMessage(
      new Error("Failed to fetch"),
      "http://127.0.0.1:8788",
    );
    assert.match(msg, /dev-worker/i);
  });
});

describe("resolveWallMode", () => {
  it("uses columns in landscape", () => {
    assert.equal(resolveWallMode({ orientation: "landscape", width: 900 }), "columns");
  });

  it("uses rows in portrait", () => {
    assert.equal(resolveWallMode({ orientation: "portrait", width: 375 }), "rows");
  });
});

describe("posterStatusKind", () => {
  it("returns wait while loading", () => {
    assert.equal(posterStatusKind({ flightsLength: 0, loading: true }), "wait");
  });

  it("returns ok when flights present", () => {
    assert.equal(posterStatusKind({ flightsLength: 3, stale: true }), "ok");
  });

  it("returns stale when empty and stale", () => {
    assert.equal(posterStatusKind({ flightsLength: 0, stale: true }), "stale");
  });

  it("returns err on network failure", () => {
    assert.equal(posterStatusKind({ flightsLength: 0, networkError: true }), "err");
  });
});

describe("formatDistanceNm", () => {
  it("formats nautical miles", () => {
    assert.equal(formatDistanceNm(12.34), "12.3 nm");
    assert.equal(formatDistanceNm(null), "—");
  });
});

describe("buildPosterStatusCopy", () => {
  it("includes radius in empty detail", () => {
    const copy = buildPosterStatusCopy("empty", { radiusMi: 40, updatedLabel: "8:00 AM" });
    assert.match(copy.detail, /40 mi/);
    assert.equal(copy.word, "EMPTY");
  });

  it("covers stale empty state", () => {
    const copy = buildPosterStatusCopy("stale", { updatedLabel: "8:05 AM" });
    assert.equal(copy.word, "STALE");
    assert.match(copy.detail, /unavailable/i);
  });
});

describe("resolveWorkerBase", () => {
  it("uses local Worker on 127.0.0.1", () => {
    assert.equal(
      resolveWorkerBase({ hostname: "127.0.0.1", search: "" }),
      LOCAL_WORKER_BASE,
    );
  });

  it("uses Pi tunnel API on github.io by default", () => {
    assert.equal(
      resolveWorkerBase({ hostname: "danjohnsonnj.github.io", search: "" }),
      PROD_API_BASE,
    );
  });

  it("?worker=prod forces Pi tunnel API from localhost", () => {
    assert.equal(
      resolveWorkerBase({ hostname: "127.0.0.1", search: "?worker=prod" }),
      PROD_API_BASE,
    );
  });

  it("?worker=cloudflare forces legacy workers.dev from github.io", () => {
    assert.equal(
      resolveWorkerBase({
        hostname: "danjohnsonnj.github.io",
        search: "?worker=cloudflare",
      }),
      CLOUDFLARE_WORKER_BASE,
    );
  });

  it("?worker=cloudflare forces legacy workers.dev from localhost", () => {
    assert.equal(
      resolveWorkerBase({ hostname: "127.0.0.1", search: "?worker=cloudflare" }),
      CLOUDFLARE_WORKER_BASE,
    );
  });

  it("uses same-hostname local Worker on RFC1918 LAN IP", () => {
    assert.equal(
      resolveWorkerBase({ hostname: "192.168.1.50", search: "" }),
      "http://192.168.1.50:8788",
    );
  });
});

describe("assignPaperSlot", () => {
  it("maps pack indices to slots 1..slotCount", () => {
    assert.equal(assignPaperSlot(0), 1);
    assert.equal(assignPaperSlot(9), 10);
    assert.equal(assignPaperSlot(10), 1);
  });

  it("handles negative indices modulo slotCount", () => {
    assert.equal(assignPaperSlot(-1), 10);
    assert.equal(assignPaperSlot(-11), 10);
  });

  it("falls back to slot 1 for invalid slotCount", () => {
    assert.equal(assignPaperSlot(3, 0), 1);
    assert.equal(assignPaperSlot(3, -2), 1);
    assert.equal(assignPaperSlot(3, NaN), 1);
  });

  it("falls back to slot 1 for non-finite index", () => {
    assert.equal(assignPaperSlot(NaN), 1);
    assert.equal(assignPaperSlot(undefined), 1);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFlightsUrl,
  filterFlights,
  formatPackStatus,
  isCompleteFlight,
  parseStoredNumber,
  pickGeocodeResult,
  unauthorizedStatusMessage,
} from "./lib.js";
import { LOCAL_WORKER_BASE, PROD_WORKER_BASE, resolveWorkerBase } from "./config.js";

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

describe("resolveWorkerBase", () => {
  it("uses local Worker on 127.0.0.1", () => {
    assert.equal(
      resolveWorkerBase({ hostname: "127.0.0.1", search: "" }),
      LOCAL_WORKER_BASE,
    );
  });

  it("uses production on github.io", () => {
    assert.equal(
      resolveWorkerBase({ hostname: "danjohnsonnj.github.io", search: "" }),
      PROD_WORKER_BASE,
    );
  });

  it("?worker=prod forces production from localhost", () => {
    assert.equal(
      resolveWorkerBase({ hostname: "127.0.0.1", search: "?worker=prod" }),
      PROD_WORKER_BASE,
    );
  });
});

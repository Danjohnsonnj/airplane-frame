import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFlightRow,
  enrichAdsbdb,
  enrichAircraftList,
  enrichAirLabs,
  fetchAirplanesLive,
  fetchJson,
  parseAdsbdbPayload,
} from "../src/providers.js";

const UAL1_ROUTE = {
  response: {
    flightroute: {
      callsign: "UAL1",
      airline: {
        name: "United Airlines",
        icao: "UAL",
        iata: "UA",
      },
      origin: {
        iata_code: "SFO",
        icao_code: "KSFO",
      },
      destination: {
        iata_code: "EWR",
        icao_code: "KEWR",
      },
    },
  },
};

function adsbdbOk(body = UAL1_ROUTE) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

describe("fetchAirplanesLive", () => {
  it("retries once on 429 then succeeds", async () => {
    let calls = 0;
    const mockFetch = async (url) => {
      calls += 1;
      if (calls === 1) {
        return { ok: false, status: 429, text: async () => "" };
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ac: [{ flight: "UAL1", desc: "B737", alt_baro: 5000 }] }),
      };
    };
    const ac = await fetchAirplanesLive(40.728, -74.078, 22, {
      fetch: mockFetch,
      retryDelayMs: 1,
    });
    assert.equal(calls, 2);
    assert.equal(ac.length, 1);
  });

  it("throws after retry still fails", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 429,
      text: async () => "",
    });
    await assert.rejects(
      () =>
        fetchAirplanesLive(40.728, -74.078, 22, {
          fetch: mockFetch,
          retryDelayMs: 1,
        }),
      /HTTP 429/,
    );
  });
});

describe("fetchJson", () => {
  it("passes an AbortSignal to fetch", async () => {
    let sawSignal = false;
    const mockFetch = async (_url, init) => {
      sawSignal = init.signal instanceof AbortSignal;
      return { ok: true, status: 200, text: async () => "{}" };
    };
    await fetchJson("https://example.test/ok", {
      fetch: mockFetch,
      timeoutMs: 5_000,
    });
    assert.equal(sawSignal, true);
  });

  it("maps AbortError from fetch into TIMEOUT AbortError", async () => {
    const mockFetch = async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    };
    await assert.rejects(
      () =>
        fetchJson("https://example.test/slow", {
          fetch: mockFetch,
          timeoutMs: 5_000,
        }),
      (err) => err.name === "AbortError" && err.code === "TIMEOUT",
    );
  });
});

describe("parseAdsbdbPayload", () => {
  it("maps nested flightroute to origin/destination/carrier", () => {
    assert.deepEqual(parseAdsbdbPayload(UAL1_ROUTE), {
      origin: "SFO",
      destination: "EWR",
      carrier: "United Airlines",
    });
  });

  it("returns null without destination", () => {
    assert.equal(
      parseAdsbdbPayload({
        response: { flightroute: { airline: { name: "United Airlines" } } },
      }),
      null,
    );
  });
});

describe("enrichAdsbdb", () => {
  it("returns mapped route on 200", async () => {
    const mockFetch = async () => adsbdbOk();
    const result = await enrichAdsbdb("UAL1", { fetch: mockFetch });
    assert.deepEqual(result, {
      origin: "SFO",
      destination: "EWR",
      carrier: "United Airlines",
    });
  });

  it("returns soft miss sentinel on 404", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 404,
      text: async () => "",
    });
    const result = await enrichAdsbdb("UAL1", { fetch: mockFetch });
    assert.deepEqual(result, { _softMiss: true, status: 404 });
  });

  it("returns soft miss sentinel on 400", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 400,
      text: async () => "",
    });
    const result = await enrichAdsbdb("UA1", { fetch: mockFetch });
    assert.deepEqual(result, { _softMiss: true, status: 400 });
  });

  it("returns null on other soft 4xx without negative-cache sentinel", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 403,
      text: async () => "",
    });
    const result = await enrichAdsbdb("UAL1", { fetch: mockFetch });
    assert.equal(result, null);
  });

  it("returns unavailable sentinel on 502", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 502,
      text: async () => "",
    });
    const result = await enrichAdsbdb("UAL1", { fetch: mockFetch });
    assert.deepEqual(result, { _adsbdbUnavailable: true });
  });

  it("returns unavailable sentinel on 429", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 429,
      text: async () => "",
    });
    const result = await enrichAdsbdb("UAL1", { fetch: mockFetch });
    assert.deepEqual(result, { _adsbdbUnavailable: true });
  });
});

describe("buildFlightRow", () => {
  const base = {
    flight: "UAL700  ",
    desc: "BOEING 737 MAX 9",
    t: "B39M",
    ownOp: "UMB BANK NA TRUSTEE",
    alt_baro: 5000,
    dst: 10,
    lat: 40.7,
    lon: -74.0,
  };

  const adsbdbRow = {
    origin: "SFO",
    destination: "EWR",
    carrier: "United Airlines",
  };

  it("prefers AirLabs carrier and destination", () => {
    const row = buildFlightRow(
      base,
      {
        airline_name: "United Airlines",
        dep_iata: "BOS",
        arr_iata: "LAX",
      },
      adsbdbRow,
    );
    assert.equal(row.carrier, "United Airlines");
    assert.equal(row.destination, "LAX");
    assert.equal(row.origin, "BOS");
    assert.equal(row.enrichmentSource, "airlabs");
    assert.equal(row.planeType, "BOEING 737 MAX 9");
  });

  it("falls back to adsbdb route", () => {
    const row = buildFlightRow(base, null, adsbdbRow);
    assert.equal(row.destination, "EWR");
    assert.equal(row.origin, "SFO");
    assert.equal(row.enrichmentSource, "adsbdb");
    assert.equal(row.carrier, "United Airlines");
  });

  it("uses ownOp when adsbdb has route but no airline", () => {
    const trusteeBase = { ...base, ownOp: "UNITED AIRLINES INC" };
    const row = buildFlightRow(
      trusteeBase,
      null,
      { origin: "BOS", destination: "EWR", carrier: null },
    );
    assert.equal(row.carrier, "United Airlines");
    assert.equal(row.enrichmentSource, "adsbdb");
  });

  it("keeps AirLabs airline_name over ownOp normalization", () => {
    const row = buildFlightRow(
      { ...base, ownOp: "UNITED AIRLINES INC" },
      { airline_name: "United Airlines", dep_iata: "BOS", arr_iata: "EWR" },
      adsbdbRow,
    );
    assert.equal(row.carrier, "United Airlines");
    assert.equal(row.enrichmentSource, "airlabs");
  });

  it("returns null without destination", () => {
    assert.equal(buildFlightRow(base, null, null), null);
  });

  it("skips ground aircraft", () => {
    assert.equal(
      buildFlightRow(
        { ...base, alt_baro: "ground" },
        { arr_iata: "EWR", airline_name: "United Airlines" },
        null,
      ),
      null,
    );
  });
});

function jsonOk(body) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

function ac(flight, opts = {}) {
  return {
    flight,
    desc: opts.desc || "BOEING 737",
    t: opts.t || "B737",
    ownOp: opts.ownOp || "UNITED AIRLINES INC",
    alt_baro: opts.alt_baro ?? 10000,
    dst: opts.dst ?? 10,
    lat: 40.7,
    lon: -74.0,
  };
}

describe("enrichAirLabs", () => {
  it("returns limit sentinel for quota/key error codes", async () => {
    const mockFetch = async () =>
      jsonOk({ error: { code: "month_limit_exceeded", message: "limit" } });
    const result = await enrichAirLabs("UAL1", "key", { fetch: mockFetch });
    assert.deepEqual(result, {
      _airlabsLimit: true,
      code: "month_limit_exceeded",
    });
  });

  it("returns null on soft miss", async () => {
    const mockFetch = async () => jsonOk({ response: null });
    const result = await enrichAirLabs("UAL1", "key", { fetch: mockFetch });
    assert.equal(result, null);
  });
});

describe("enrichAircraftList", () => {
  it("never attempts aircraft below minAltitudeFt", async () => {
    const urls = [];
    const mockFetch = async (url) => {
      urls.push(String(url));
      return adsbdbOk();
    };
    const { candidates, stats } = await enrichAircraftList(
      [ac("UAL100", { alt_baro: 500, dst: 1 }), ac("UAL200", { alt_baro: 5000, dst: 2 })],
      {
        airlabsKey: "key",
        maxAttempt: 10,
        maxAirlabs: 5,
        maxResults: 20,
        minAltitudeFt: 1000,
        fetch: mockFetch,
      },
    );
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].flight, "UAL200");
    assert.equal(stats.attempted, 1);
    assert.ok(urls.every((u) => !u.includes("airlabs")));
    assert.ok(urls.some((u) => u.includes("adsbdb") && u.includes("UAL200")));
    assert.ok(!urls.some((u) => u.includes("UAL100")));
  });

  it("orders airline-ish callsigns before N-numbers", async () => {
    const attempted = [];
    const mockFetch = async (url) => {
      const m = String(url).match(/callsign\/([^/?]+)/i);
      if (m) attempted.push(m[1]);
      return adsbdbOk();
    };
    await enrichAircraftList(
      [
        ac("N123AB", { dst: 1, ownOp: "PRIVATE OWNER" }),
        ac("UAL300", { dst: 50 }),
      ],
      {
        airlabsKey: "",
        maxAttempt: 10,
        maxAirlabs: 5,
        maxResults: 20,
        minAltitudeFt: 0,
        fetch: mockFetch,
      },
    );
    assert.deepEqual(attempted, ["UAL300", "N123AB"]);
  });

  it("with sortByDistance orders airline-ish by closest distance first", async () => {
    const attempted = [];
    const mockFetch = async (url) => {
      const m = String(url).match(/callsign\/([^/?]+)/i);
      if (m) attempted.push(m[1]);
      return adsbdbOk();
    };
    await enrichAircraftList(
      [
        ac("UAL100", { dst: 20 }),
        ac("UAL200", { dst: 5 }),
      ],
      {
        airlabsKey: "",
        maxAttempt: 10,
        maxAirlabs: 5,
        maxResults: 20,
        minAltitudeFt: 0,
        sortByDistance: true,
        fetch: mockFetch,
      },
    );
    assert.deepEqual(attempted, ["UAL200", "UAL100"]);
  });

  it("with sortByDistance keeps airline-ish ahead of closer N-numbers", async () => {
    const attempted = [];
    const mockFetch = async (url) => {
      const m = String(url).match(/callsign\/([^/?]+)/i);
      if (m) attempted.push(m[1]);
      return adsbdbOk();
    };
    await enrichAircraftList(
      [
        ac("N123AB", { dst: 1, ownOp: "PRIVATE OWNER" }),
        ac("UAL300", { dst: 50 }),
      ],
      {
        airlabsKey: "",
        maxAttempt: 10,
        maxAirlabs: 5,
        maxResults: 20,
        minAltitudeFt: 0,
        sortByDistance: true,
        fetch: mockFetch,
      },
    );
    assert.deepEqual(attempted, ["UAL300", "N123AB"]);
  });

  it("skips AirLabs when adsbdb completes the row", async () => {
    let airlabsCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("airlabs")) {
        airlabsCalls += 1;
        return jsonOk({
          response: {
            airline_name: "United Airlines",
            dep_iata: "BOS",
            arr_iata: "EWR",
          },
        });
      }
      return adsbdbOk();
    };
    const { candidates, stats } = await enrichAircraftList([ac("UAL400")], {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
    });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].enrichmentSource, "adsbdb");
    assert.equal(airlabsCalls, 0);
    assert.equal(stats.airlabsCalls, 0);
    assert.equal(stats.adsbdbCalls, 1);
    assert.equal(stats.complete, 1);
    assert.equal(stats.cached, false);
  });

  it("stops AirLabs at maxAirlabs", async () => {
    let airlabsCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("airlabs")) {
        airlabsCalls += 1;
        return jsonOk({ response: null });
      }
      return { ok: false, status: 404, text: async () => "" };
    };
    const list = [
      ac("UAL501", { ownOp: "" }),
      ac("UAL502", { ownOp: "" }),
      ac("UAL503", { ownOp: "" }),
    ];
    const { stats } = await enrichAircraftList(list, {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 2,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
    });
    assert.equal(airlabsCalls, 2);
    assert.equal(stats.airlabsCalls, 2);
    assert.equal(stats.attempted, 3);
  });

  it("trips breaker on limit codes and stops further AirLabs", async () => {
    let airlabsCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("airlabs")) {
        airlabsCalls += 1;
        return jsonOk({ error: { code: "hour_limit_exceeded" } });
      }
      return { ok: false, status: 404, text: async () => "" };
    };
    const list = [
      ac("UAL601", { ownOp: "" }),
      ac("UAL602", { ownOp: "" }),
      ac("UAL603", { ownOp: "" }),
    ];
    const { stats } = await enrichAircraftList(list, {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
    });
    assert.equal(airlabsCalls, 1);
    assert.equal(stats.airlabsCalls, 1);
  });

  it("keeps calling adsbdb after soft 404 misses", async () => {
    let adsbdbCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("adsbdb")) {
        adsbdbCalls += 1;
        return { ok: false, status: 404, text: async () => "" };
      }
      return jsonOk({
        response: {
          airline_name: "United Airlines",
          dep_iata: "BOS",
          arr_iata: "EWR",
        },
      });
    };
    const list = [
      ac("UAL801", { ownOp: "" }),
      ac("UAL802", { ownOp: "" }),
      ac("UAL803", { ownOp: "" }),
    ];
    const { stats } = await enrichAircraftList(list, {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
    });
    assert.equal(adsbdbCalls, 3);
    assert.equal(stats.adsbdbCalls, 3);
    assert.equal(stats.adsbdbSkipped, false);
    assert.equal(stats.airlabsCalls, 3);
  });

  it("skips further adsbdb after hard 502 and still gap-fills AirLabs", async () => {
    let adsbdbCalls = 0;
    let airlabsCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("adsbdb")) {
        adsbdbCalls += 1;
        return { ok: false, status: 502, text: async () => "" };
      }
      if (String(url).includes("airlabs")) {
        airlabsCalls += 1;
        return jsonOk({
          response: {
            airline_name: "United Airlines",
            dep_iata: "BOS",
            arr_iata: "EWR",
          },
        });
      }
      return jsonOk({});
    };
    const list = [
      ac("UAL901", { ownOp: "" }),
      ac("UAL902", { ownOp: "" }),
      ac("UAL903", { ownOp: "" }),
    ];
    const { candidates, stats } = await enrichAircraftList(list, {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
    });
    assert.equal(adsbdbCalls, 1);
    assert.equal(stats.adsbdbCalls, 1);
    assert.equal(stats.adsbdbSkipped, true);
    assert.equal(airlabsCalls, 3);
    assert.equal(candidates.length, 3);
  });

  it("early-stops when pool reaches maxResults", async () => {
    let adsbdbCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("adsbdb")) {
        adsbdbCalls += 1;
        return adsbdbOk();
      }
      return jsonOk({ response: null });
    };
    const list = Array.from({ length: 8 }, (_, i) =>
      ac(`UAL70${i}`, { dst: i + 1 }),
    );
    const { candidates, stats } = await enrichAircraftList(list, {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 3,
      minAltitudeFt: 0,
      fetch: mockFetch,
    });
    assert.equal(candidates.length, 3);
    assert.equal(stats.complete, 3);
    assert.equal(adsbdbCalls, 3);
    assert.equal(stats.attempted, 3);
  });
});

function memoryKv() {
  /** @type {Record<string, string>} */
  const store = Object.create(null);
  return {
    async get(key) {
      return store[key] ?? null;
    },
    async put(key, value) {
      store[key] = String(value);
    },
    store,
  };
}

describe("enrichAircraftList callsign cache", () => {
  it("positive hit skips adsbdb and AirLabs on second pass", async () => {
    const kv = memoryKv();
    const nowMs = 5_000_000;
    let adsbdbCalls = 0;
    let airlabsCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("adsbdb")) {
        adsbdbCalls += 1;
        return adsbdbOk();
      }
      if (String(url).includes("airlabs")) {
        airlabsCalls += 1;
        return jsonOk({ response: null });
      }
      return adsbdbOk();
    };
    const opts = {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
      kv,
      nowMs,
    };

    const first = await enrichAircraftList([ac("UAL400")], opts);
    assert.equal(first.stats.adsbdbCalls, 1);
    assert.equal(first.stats.callsignCacheHits, 0);

    const second = await enrichAircraftList([ac("UAL400")], opts);
    assert.equal(second.stats.callsignCacheHits, 1);
    assert.equal(second.stats.adsbdbCalls, 0);
    assert.equal(second.stats.airlabsCalls, 0);
    assert.equal(adsbdbCalls, 1);
    assert.equal(airlabsCalls, 0);
    assert.equal(second.candidates[0].enrichmentSource, "adsbdb");
  });

  it("adsbdb 404 negative cache still allows AirLabs", async () => {
    const kv = memoryKv();
    const nowMs = 6_000_000;
    let adsbdbCalls = 0;
    let airlabsCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("adsbdb")) {
        adsbdbCalls += 1;
        return { ok: false, status: 404, text: async () => "" };
      }
      if (String(url).includes("airlabs")) {
        airlabsCalls += 1;
        return jsonOk({
          response: {
            airline_name: "United Airlines",
            dep_iata: "BOS",
            arr_iata: "EWR",
          },
        });
      }
      return adsbdbOk();
    };
    const opts = {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
      kv,
      nowMs,
      callsignNegAdsbdbTtlSec: 600,
    };

    const first = await enrichAircraftList([ac("UAL501", { ownOp: "" })], opts);
    assert.equal(first.stats.adsbdbCalls, 1);
    assert.equal(first.stats.airlabsCalls, 1);
    assert.equal(first.candidates.length, 1);

    const second = await enrichAircraftList([ac("UAL501", { ownOp: "" })], opts);
    assert.equal(second.stats.adsbdbCalls, 0);
    assert.equal(second.stats.airlabsCalls, 0);
    assert.equal(adsbdbCalls, 1);
    assert.equal(airlabsCalls, 1);
  });

  it("AirLabs miss negative cache skips repeat AirLabs calls", async () => {
    const kv = memoryKv();
    const nowMs = 7_000_000;
    let airlabsCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("adsbdb")) {
        return { ok: false, status: 404, text: async () => "" };
      }
      if (String(url).includes("airlabs")) {
        airlabsCalls += 1;
        return jsonOk({ response: null });
      }
      return adsbdbOk();
    };
    const opts = {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
      kv,
      nowMs,
      callsignNegAirlabsTtlSec: 1800,
    };

    await enrichAircraftList([ac("UAL601", { ownOp: "" })], opts);
    assert.equal(airlabsCalls, 1);

    await enrichAircraftList([ac("UAL601", { ownOp: "" })], opts);
    assert.equal(airlabsCalls, 1);
  });

  it("does not write adsbdb negative on 403", async () => {
    const kv = memoryKv();
    const nowMs = 8_000_000;
    const mockFetch = async () => ({
      ok: false,
      status: 403,
      text: async () => "",
    });
    await enrichAircraftList([ac("UAL701", { ownOp: "" })], {
      airlabsKey: "",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: mockFetch,
      kv,
      nowMs,
    });
    assert.equal(kv.store["cs:miss:adsbdb:UAL701"], undefined);
  });

  it("does not write negative cache on hard adsbdb fail or AirLabs breaker", async () => {
    const kv = memoryKv();
    const nowMs = 9_000_000;
    await enrichAircraftList([ac("UAL901", { ownOp: "" })], {
      airlabsKey: "key",
      maxAttempt: 10,
      maxAirlabs: 5,
      maxResults: 20,
      minAltitudeFt: 0,
      fetch: async (url) => {
        if (String(url).includes("adsbdb")) {
          return { ok: false, status: 502, text: async () => "" };
        }
        return jsonOk({ error: { code: "hour_limit_exceeded" } });
      },
      kv,
      nowMs,
    });
    assert.equal(kv.store["cs:miss:adsbdb:UAL901"], undefined);
    assert.equal(kv.store["cs:miss:airlabs:UAL901"], undefined);
  });
});

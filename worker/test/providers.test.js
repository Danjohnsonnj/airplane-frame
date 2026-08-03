import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFlightRow,
  enrichAircraftList,
  enrichAirLabs,
  enrichHexdb,
  fetchAirplanesLive,
  fetchJson,
} from "../src/providers.js";

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

describe("enrichHexdb", () => {
  it("returns soft null on 404", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 404,
      text: async () => "",
    });
    const result = await enrichHexdb("UAL1", { fetch: mockFetch });
    assert.equal(result, null);
  });

  it("returns unavailable sentinel on 502", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 502,
      text: async () => "",
    });
    const result = await enrichHexdb("UAL1", { fetch: mockFetch });
    assert.deepEqual(result, { _hexdbUnavailable: true });
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

  it("prefers AirLabs carrier and destination", () => {
    const row = buildFlightRow(
      base,
      {
        airline_name: "United Airlines",
        dep_iata: "BOS",
        arr_iata: "EWR",
      },
      null,
    );
    assert.equal(row.carrier, "United Airlines");
    assert.equal(row.destination, "EWR");
    assert.equal(row.origin, "BOS");
    assert.equal(row.enrichmentSource, "airlabs");
    assert.equal(row.planeType, "BOEING 737 MAX 9");
  });

  it("falls back to hexdb route", () => {
    const row = buildFlightRow(base, null, { route: "KBOS-KEWR" });
    assert.equal(row.destination, "KEWR");
    assert.equal(row.origin, "KBOS");
    assert.equal(row.enrichmentSource, "hexdb");
    assert.equal(row.carrier, "UMB BANK NA TRUSTEE");
  });

  it("normalizes UNITED AIRLINES INC ownOp to brand book name on hexdb path", () => {
    const trusteeBase = { ...base, ownOp: "UNITED AIRLINES INC" };
    const row = buildFlightRow(trusteeBase, null, { route: "KBOS-KEWR" });
    assert.equal(row.carrier, "United Airlines");
    assert.equal(row.enrichmentSource, "hexdb");
  });

  it("keeps AirLabs airline_name over ownOp normalization", () => {
    const row = buildFlightRow(
      { ...base, ownOp: "UNITED AIRLINES INC" },
      { airline_name: "United Airlines", dep_iata: "BOS", arr_iata: "EWR" },
      null,
    );
    assert.equal(row.carrier, "United Airlines");
    assert.equal(row.enrichmentSource, "airlabs");
  });

  it("returns null without destination", () => {
    assert.equal(buildFlightRow(base, null, null), null);
  });

  it("skips ground aircraft", () => {
    assert.equal(buildFlightRow({ ...base, alt_baro: "ground" }, { arr_iata: "EWR", airline_name: "United Airlines" }, null), null);
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
      return jsonOk({ route: "KBOS-KEWR" });
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
    assert.ok(urls.some((u) => u.includes("hexdb") && u.includes("UAL200")));
    assert.ok(!urls.some((u) => u.includes("UAL100")));
  });

  it("orders airline-ish callsigns before N-numbers", async () => {
    const attempted = [];
    const mockFetch = async (url) => {
      const m = String(url).match(/icao\/([^/?]+)/i);
      if (m) attempted.push(m[1]);
      return jsonOk({ route: "KBOS-KEWR" });
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

  it("skips AirLabs when hexdb completes the row", async () => {
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
      return jsonOk({ route: "KBOS-KEWR" });
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
    assert.equal(candidates[0].enrichmentSource, "hexdb");
    assert.equal(airlabsCalls, 0);
    assert.equal(stats.airlabsCalls, 0);
    assert.equal(stats.hexdbCalls, 1);
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
      // hexdb miss so AirLabs is needed
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

  it("keeps calling hexdb after soft 404 misses", async () => {
    let hexdbCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("hexdb")) {
        hexdbCalls += 1;
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
    assert.equal(hexdbCalls, 3);
    assert.equal(stats.hexdbCalls, 3);
    assert.equal(stats.hexdbSkipped, false);
    assert.equal(stats.airlabsCalls, 3);
  });

  it("skips further hexdb after hard 502 and still gap-fills AirLabs", async () => {
    let hexdbCalls = 0;
    let airlabsCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("hexdb")) {
        hexdbCalls += 1;
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
    assert.equal(hexdbCalls, 1);
    assert.equal(stats.hexdbCalls, 1);
    assert.equal(stats.hexdbSkipped, true);
    assert.equal(airlabsCalls, 3);
    assert.equal(candidates.length, 3);
  });

  it("early-stops when pool reaches maxResults", async () => {
    let hexdbCalls = 0;
    const mockFetch = async (url) => {
      if (String(url).includes("hexdb")) {
        hexdbCalls += 1;
        return jsonOk({ route: "KBOS-KEWR" });
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
    assert.equal(hexdbCalls, 3);
    assert.equal(stats.attempted, 3);
  });
});

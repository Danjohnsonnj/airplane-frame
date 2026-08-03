import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createServer, envFromProcess } from "../src/node/server.js";

function mockKv() {
  return {
    async get() {
      return null;
    },
    async put() {},
  };
}

async function withServer(env, fn) {
  const started = await createServer({
    HOST: "127.0.0.1",
    PORT: 0,
    FLIGHT_CACHE: mockKv(),
    APP_SHARED_SECRET: "test-secret",
    AIRLABS_API_KEY: "",
    ...env,
  });
  try {
    const { port } = started;
    const base = `http://127.0.0.1:${port}`;
    await fn(base, started);
  } finally {
    await started.close();
  }
}

describe("createServer", () => {
  it("GET /health returns 200 JSON { ok: true }", async () => {
    await withServer({}, async (base) => {
      const res = await fetch(`${base}/health`);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { ok: true });
    });
  });

  it("unsupported path returns 404 JSON", async () => {
    await withServer({}, async (base) => {
      const res = await fetch(`${base}/nope`);
      assert.equal(res.status, 404);
      assert.deepEqual(await res.json(), { error: "not found" });
    });
  });

  it("/flights without Authorization returns 401 and does not need upstream", async () => {
    await withServer({}, async (base) => {
      const res = await fetch(
        `${base}/flights?lat=40.728&lon=-74.078&radiusMi=25`,
      );
      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), { error: "unauthorized" });
    });
  });
});

describe("envFromProcess", () => {
  it("includes callsign cache TTL defaults when unset", () => {
    const keys = [
      "CALLSIGN_CACHE_TTL_SECONDS",
      "CALLSIGN_NEG_ADSBDB_TTL_SECONDS",
      "CALLSIGN_NEG_AIRLABS_TTL_SECONDS",
    ];
    /** @type {Record<string, string|undefined>} */
    const saved = {};
    for (const key of keys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    try {
      const env = envFromProcess();
      assert.equal(env.CALLSIGN_CACHE_TTL_SECONDS, "900");
      assert.equal(env.CALLSIGN_NEG_ADSBDB_TTL_SECONDS, "600");
      assert.equal(env.CALLSIGN_NEG_AIRLABS_TTL_SECONDS, "1800");
    } finally {
      for (const key of keys) {
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
      }
    }
  });
});

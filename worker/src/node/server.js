import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../index.js";
import { FileKv } from "./file-kv.js";

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {string} host
 * @param {number} port
 * @returns {Promise<Request>}
 */
async function toFetchRequest(req, host, port) {
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(name, v);
    } else {
      headers.set(name, value);
    }
  }

  /** @type {RequestInit} */
  const init = { method: req.method || "GET", headers };
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    init.body = Buffer.concat(chunks);
  }
  return new Request(url, init);
}

/**
 * @param {import("node:http").ServerResponse} res
 * @param {Response} response
 */
async function writeFetchResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => {
    // Node handles set-cookie specially; Worker responses here are JSON only.
    res.setHeader(name, value);
  });
  const buf = Buffer.from(await response.arrayBuffer());
  res.end(buf);
}

/**
 * Bind a Node HTTP server that delegates to the existing Worker fetch handler.
 * Production defaults: 127.0.0.1:8788 (never 0.0.0.0 unless env overrides for tests).
 *
 * @param {object} env
 * @returns {Promise<{ server: import("node:http").Server, close: () => Promise<void>, host: string, port: number }>}
 */
export async function createServer(env) {
  const host = env.HOST || "127.0.0.1";
  const port = Number(env.PORT ?? 8788);

  if (!env.FLIGHT_CACHE) {
    throw new Error("FLIGHT_CACHE binding missing");
  }

  const server = http.createServer(async (req, res) => {
    try {
      const request = await toFetchRequest(req, host, port);
      const response = await worker.fetch(request, env, {});
      await writeFetchResponse(res, response);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error: "internal",
          message: String(err?.message || err),
        }),
      );
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  const address = server.address();
  const boundPort =
    address && typeof address === "object" ? address.port : port;

  const close = () =>
    new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

  return { server, close, host, port: boundPort };
}

function envFromProcess() {
  const cachePath =
    process.env.FLIGHT_CACHE_PATH || "./.pi-cache/cache.json";
  return {
    HOST: process.env.HOST || "127.0.0.1",
    PORT: Number(process.env.PORT || 8788),
    FLIGHT_CACHE_PATH: cachePath,
    FLIGHT_CACHE: new FileKv(cachePath),
    AIRLABS_API_KEY: process.env.AIRLABS_API_KEY || "",
    APP_SHARED_SECRET: process.env.APP_SHARED_SECRET || "",
    CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS || "600",
    EMPTY_CACHE_TTL_SECONDS: process.env.EMPTY_CACHE_TTL_SECONDS || "60",
    STALE_TTL_SECONDS: process.env.STALE_TTL_SECONDS || "3600",
    MAX_ATTEMPT: process.env.MAX_ATTEMPT || process.env.MAX_ENRICH || "36",
    MAX_AIRLABS: process.env.MAX_AIRLABS || "5",
    MAX_RESULTS: process.env.MAX_RESULTS || "20",
    PACK_SIZE: process.env.PACK_SIZE || "10",
  };
}

async function main() {
  const env = envFromProcess();
  const { host, port, close } = await createServer(env);

  const shutdown = async (signal) => {
    console.error(`airplane-frame-worker: ${signal}, closing`);
    try {
      await close();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  console.error(`airplane-frame-worker listening on http://${host}:${port}`);
}

const thisFile = fileURLToPath(import.meta.url);
const isMain =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === path.resolve(thisFile);

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import { FileKv } from "../src/node/file-kv.js";

describe("FileKv", () => {
  /** @type {string} */
  let dir;
  /** @type {string} */
  let cachePath;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "airplane-frame-filekv-"));
    cachePath = path.join(dir, "cache.json");
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns null when the cache file is missing", async () => {
    const kv = new FileKv(cachePath);
    assert.equal(await kv.get("cand:1:2:3", "text"), null);
  });

  it("persists put so a fresh FileKv instance can read it", async () => {
    const kv = new FileKv(cachePath);
    await kv.put("cand:1:2:3", '{"fetchedAt":1,"candidates":[]}');

    const again = new FileKv(cachePath);
    assert.equal(
      await again.get("cand:1:2:3", "text"),
      '{"fetchedAt":1,"candidates":[]}',
    );
  });

  it("starts empty when the cache file contains invalid JSON", async () => {
    await fs.writeFile(cachePath, "{not-json", "utf8");
    const kv = new FileKv(cachePath);
    assert.equal(await kv.get("any", "text"), null);
    await assert.doesNotReject(() => kv.put("k", "v"));
  });

  it("does not replace the prior cache file until rename succeeds", async () => {
    const kvGood = new FileKv(cachePath);
    await kvGood.put("keep", "original");

    let renameCalls = 0;
    const flakyFs = {
      ...fs,
      async mkdir(p, opts) {
        return fs.mkdir(p, opts);
      },
      async readFile(p, enc) {
        return fs.readFile(p, enc);
      },
      async writeFile(p, data, enc) {
        return fs.writeFile(p, data, enc);
      },
      async rename(from, to) {
        renameCalls += 1;
        if (renameCalls === 1) {
          throw new Error("simulated rename failure");
        }
        return fs.rename(from, to);
      },
    };

    const kvFlaky = new FileKv(cachePath, { fs: flakyFs });
    await assert.rejects(() => kvFlaky.put("keep", "replaced"), /simulated rename/);

    const onDisk = await fs.readFile(cachePath, "utf8");
    assert.equal(JSON.parse(onDisk).keep, "original");

    const reader = new FileKv(cachePath);
    assert.equal(await reader.get("keep", "text"), "original");
  });
});

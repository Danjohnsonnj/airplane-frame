import fsPromises from "node:fs/promises";
import path from "node:path";

/**
 * Minimal Workers-KV-shaped store backed by one JSON file on disk.
 * Interface consumed by resolveCandidates: get(key, "text") and put(key, value).
 */
export class FileKv {
  /**
   * @param {string} filePath
   * @param {{ fs?: typeof fsPromises }} [opts]
   */
  constructor(filePath, opts = {}) {
    this.filePath = filePath;
    this.fs = opts.fs || fsPromises;
    /** @type {Record<string, string>} */
    this.data = Object.create(null);
    this._ready = this._load();
  }

  async _load() {
    try {
      const raw = await this.fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        /** @type {Record<string, string>} */
        const next = Object.create(null);
        for (const [k, v] of Object.entries(parsed)) {
          next[k] = typeof v === "string" ? v : String(v);
        }
        this.data = next;
      }
    } catch (err) {
      // Missing or invalid → empty cache; do not throw (health must stay up).
      this.data = Object.create(null);
      if (err && err.code && err.code !== "ENOENT") {
        // keep empty
      }
    }
  }

  /**
   * @param {string} key
   * @param {string} [_type]
   * @returns {Promise<string|null>}
   */
  async get(key, _type) {
    await this._ready;
    const value = this.data[key];
    return value === undefined ? null : value;
  }

  /**
   * @param {string} key
   * @param {string} value
   * @param {object} [_opts] Cloudflare KV options (e.g. expirationTtl) — ignored on disk
   */
  async put(key, value, _opts) {
    await this._ready;
    this.data[key] = String(value);
    await this._persist();
  }

  async _persist() {
    const dir = path.dirname(this.filePath);
    await this.fs.mkdir(dir, { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const payload = JSON.stringify(this.data);
    await this.fs.writeFile(tmp, payload, "utf8");
    try {
      await this.fs.rename(tmp, this.filePath);
    } catch (err) {
      try {
        await this.fs.unlink(tmp);
      } catch {
        // ignore cleanup failure
      }
      // Roll back in-memory write so callers do not see a phantom put.
      await this._load();
      throw err;
    }
  }
}

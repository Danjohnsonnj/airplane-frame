/**
 * Regenerate carrier :root tokens and [data-carrier] selectors in poster-ad-wall.html
 * from docs/design-reference/airline-brand-colors.md.
 *
 * Usage (from this directory): node gen-carrier-css.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const colorsPath = join(here, "../design-reference/airline-brand-colors.md");
const mockPath = join(here, "poster-ad-wall.html");

const TOKEN_BEGIN = "/* BEGIN carrier-tokens — gen: node gen-carrier-css.mjs */";
const TOKEN_END = "/* END carrier-tokens */";
const SELECTOR_BEGIN =
  "/* BEGIN carrier-selectors — gen: node gen-carrier-css.mjs */";
const SELECTOR_END = "/* END carrier-selectors */";

function kebab(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(([^)]+)\)/g, "-$1")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function parseColors(md) {
  const rows = [];
  for (const line of md.trim().split("\n")) {
    const m = line.match(/^\d+\.\s+(.+?)\s+-\s+(#[0-9A-Fa-f]+)/);
    if (!m) continue;
    rows.push({ name: m[1].trim(), hex: m[2].toUpperCase(), token: kebab(m[1]) });
  }
  if (rows.length === 0) throw new Error("No carrier rows parsed from md");
  return rows;
}

function replaceBlock(html, begin, end, body) {
  const start = html.indexOf(begin);
  const stop = html.indexOf(end);
  if (start === -1 || stop === -1 || stop <= start) {
    throw new Error(`Markers not found: ${begin} / ${end}`);
  }
  const lineStart = html.lastIndexOf("\n", start) + 1;
  const indent = html.slice(lineStart, start).match(/^(\s*)/)[1];
  const before = html.slice(0, start + begin.length);
  const after = html.slice(stop);
  return `${before}\n${body}\n${indent}${after}`;
}

const rows = parseColors(readFileSync(colorsPath, "utf8"));
const tokenLines = rows
  .map((r) => `      --${r.token}: ${r.hex};`)
  .join("\n");
const selectorLines = rows
  .map(
    (r) =>
      `    .flight-panel[data-carrier="${r.name}"] { --carrier-color: var(--${r.token}); }`,
  )
  .join("\n");

let html = readFileSync(mockPath, "utf8");
html = replaceBlock(html, TOKEN_BEGIN, TOKEN_END, tokenLines);
html = replaceBlock(html, SELECTOR_BEGIN, SELECTOR_END, selectorLines);
writeFileSync(mockPath, html);

console.log(`Updated ${mockPath} (${rows.length} carriers).`);

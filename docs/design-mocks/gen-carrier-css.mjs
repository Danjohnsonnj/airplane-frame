/**
 * Regenerate carrier tokens from docs/design-reference/airline-brand-colors.md into:
 * - poster-ad-wall.html (inline mock blocks)
 * - css/carriers.css (shipped Pages stylesheet)
 * - js/carrier-brands.js (exact brand name list for ground assignment)
 *
 * Usage (from this directory): node gen-carrier-css.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../");
const colorsPath = join(here, "../design-reference/airline-brand-colors.md");
const mockPath = join(here, "poster-ad-wall.html");
const carriersCssPath = join(repoRoot, "css/carriers.css");
const brandsJsPath = join(repoRoot, "js/carrier-brands.js");

const TOKEN_BEGIN = "/* BEGIN carrier-tokens — gen: node gen-carrier-css.mjs */";
const TOKEN_END = "/* END carrier-tokens */";
const SELECTOR_BEGIN =
  "/* BEGIN carrier-selectors — gen: node gen-carrier-css.mjs */";
const SELECTOR_END = "/* END carrier-selectors */";
const BRANDS_BEGIN =
  "/* BEGIN carrier-brand-names — gen: node gen-carrier-css.mjs */";
const BRANDS_END = "/* END carrier-brand-names */";

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

function replaceBlock(content, begin, end, body) {
  const start = content.indexOf(begin);
  const stop = content.indexOf(end);
  if (start === -1 || stop === -1 || stop <= start) {
    throw new Error(`Markers not found: ${begin} / ${end}`);
  }
  const lineStart = content.lastIndexOf("\n", start) + 1;
  const indent = content.slice(lineStart, start).match(/^(\s*)/)[1];
  const before = content.slice(0, start + begin.length);
  const after = content.slice(stop);
  return `${before}\n${body}\n${indent}${after}`;
}

function writeCarriersCss(rows) {
  const tokenLines = rows.map((r) => `  --${r.token}: ${r.hex};`).join("\n");
  const selectorLines = rows
    .map(
      (r) =>
        `.flight-panel[data-carrier="${r.name}"] { --carrier-color: var(--${r.token}); }`,
    )
    .join("\n");

  let css = existsSync(carriersCssPath)
    ? readFileSync(carriersCssPath, "utf8")
    : `/* Generated from docs/design-reference/airline-brand-colors.md */\n:root {\n${TOKEN_BEGIN}\n${TOKEN_END}\n}\n\n${SELECTOR_BEGIN}\n${SELECTOR_END}\n`;

  css = replaceBlock(css, TOKEN_BEGIN, TOKEN_END, tokenLines);
  css = replaceBlock(css, SELECTOR_BEGIN, SELECTOR_END, selectorLines);
  writeFileSync(carriersCssPath, css);
}

function writeBrandsJs(rows) {
  const names = rows.map((r) => JSON.stringify(r.name)).join(",\n  ");
  let js = existsSync(brandsJsPath)
    ? readFileSync(brandsJsPath, "utf8")
    : `${BRANDS_BEGIN}\nexport const CARRIER_BRAND_NAMES = [];\n${BRANDS_END}\n`;

  js = replaceBlock(
    js,
    BRANDS_BEGIN,
    BRANDS_END,
    `export const CARRIER_BRAND_NAMES = [\n  ${names},\n];`,
  );
  writeFileSync(brandsJsPath, js);
}

function writeMockHtml(rows) {
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
}

const rows = parseColors(readFileSync(colorsPath, "utf8"));
writeMockHtml(rows);
writeCarriersCss(rows);
writeBrandsJs(rows);

console.log(
  `Updated ${mockPath}, ${carriersCssPath}, ${brandsJsPath} (${rows.length} carriers).`,
);

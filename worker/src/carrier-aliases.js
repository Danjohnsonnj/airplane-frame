/**
 * Legal/ownOp carrier aliases → brand-book display names.
 * Source: docs/design-reference/airlines-seen-2026-08-01.md
 * Keep in sync with js/lib.js CARRIER_ALIASES + js/carrier-brands.js.
 */

/** Uppercase normalized key → canonical brand-book name */
export const CARRIER_ALIASES = {
  "UNITED AIRLINES INC": "United Airlines",
  "DELTA AIR LINES INC": "Delta Air Lines",
  "AMERICAN AIRLINES INC": "American Airlines",
};

/** Canonical names from airline-brand-colors.md (for case-insensitive match). */
export const BRAND_BOOK_NAMES = [
  "United Airlines",
  "Delta Air Lines",
  "American Airlines",
  "Jetblue Airways",
  "Spirit Airlines",
  "Frontier Airlines",
  "Southwest Airlines",
  "Alaska Airlines",
  "Air Canada",
  "British Airways",
  "Air France",
  "Lufthansa",
  "Emirates",
  "Virgin Atlantic",
  "Singapore Airlines",
  "Turkish Airlines",
  "Qatar Airways",
  "Etihad Airways",
  "KLM",
  "Swiss International Air Lines",
  "Air India",
  "Avianca",
  "Aeroméxico",
  "LATAM Airlines",
  "Copa Airlines",
  "All Nippon Airways (ANA)",
  "Japan Airlines",
  "Korean Air",
  "Asiana Airlines",
  "Cathay Pacific",
  "EVA Air",
  "Air China",
  "Qantas",
  "Air New Zealand",
  "SAS",
  "Finnair",
  "Icelandair",
  "Aer Lingus",
  "TAP Air Portugal",
  "Iberia",
  "ITA Airways",
  "Austrian Airlines",
  "Brussels Airlines",
  "LOT Polish Airlines",
  "El Al",
  "Egyptair",
  "Royal Air Maroc",
  "Ethiopian Airlines",
  "Porter Airlines",
  "Breeze Airways",
];

export function normalizeCarrierKey(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * Resolve raw carrier to brand-book name when known; else null.
 */
export function resolveToBrandBook(raw) {
  const key = normalizeCarrierKey(raw);
  if (!key) return null;
  if (CARRIER_ALIASES[key]) return CARRIER_ALIASES[key];
  for (const book of BRAND_BOOK_NAMES) {
    if (normalizeCarrierKey(book) === key) return book;
  }
  return null;
}

/** Normalize carrier for Worker JSON — brand book name or trimmed original. */
export function normalizeCarrierName(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  const resolved = resolveToBrandBook(trimmed);
  return resolved ?? trimmed;
}

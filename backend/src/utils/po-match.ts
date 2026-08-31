/*
  PO Read-Out matching — pure seam, no Medusa imports.

  Buyers' POs bury the Cardinal part number inside free-text
  descriptions ("... S&O'B 31W-2X15-7-304 2.00 LG 304 SS ..."), so
  matching is exact-by-token against the catalog's SKUs,
  case-insensitive. Substring matching is deliberately avoided — it
  surfaces dozens of unrelated parts.
*/

const SKU_TOKEN = /[A-Z0-9][A-Z0-9./]*(?:-[A-Z0-9./]+)+|[A-Z]{2,}[0-9][A-Z0-9]*/gi;

/** SKU-shaped tokens from a PO line, uppercased and deduped. */
export function extractSkuTokens(text: string): string[] {
  const matches = text.toUpperCase().match(SKU_TOKEN) ?? [];
  return [...new Set(matches)];
}

/** The catalog SKU a PO line names, or null. Catalog SKUs must be uppercased. */
export function matchLineToSku(
  text: string,
  catalogSkus: Set<string>
): string | null {
  for (const token of extractSkuTokens(text)) {
    if (catalogSkus.has(token)) {
      return token;
    }
  }
  return null;
}

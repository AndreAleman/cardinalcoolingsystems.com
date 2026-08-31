/**
 * Markup calculator arithmetic (internal pricing).
 *
 * Pure and dependency-free ON PURPOSE: the admin dashboard (vite
 * bundle) imports these same functions so the on-screen sell price and
 * totals can never drift from what the backend computes. Do not import
 * MedusaError or anything node-only here.
 *
 * Money semantics: Medusa stores prices as-is (49.99 is 49.99, never
 * cents), so every returned amount is rounded half-up to whole cents.
 */

export type PricedLine = {
  quantity: number;
  /** Operator-entered unit cost; null when the line hasn't been priced. */
  cost: number | null;
  markup_pct: number | null;
  /** The line's customer-facing unit price (sell side). */
  sell_price: number;
};

export type QuoteTotals = {
  total_cost: number;
  total_sell: number;
  margin: number;
  /** null when total_sell is 0 (empty or unpriced quote). */
  margin_pct: number | null;
  priced_lines: number;
  unpriced_lines: number;
};

/** Round half-up to whole cents, compensating binary-float drift. */
const roundToCents = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function computeSellPrice(cost: number, markupPct: number): number {
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error("Unit cost must be a non-negative number");
  }
  if (!Number.isFinite(markupPct) || markupPct < 0) {
    throw new Error("Markup % must be a non-negative number");
  }
  return roundToCents(cost * (1 + markupPct / 100));
}

export function computeQuoteTotals(lines: PricedLine[]): QuoteTotals {
  let totalCost = 0;
  let totalSell = 0;
  let priced = 0;
  let unpriced = 0;

  for (const line of lines) {
    const quantity = Number(line.quantity) || 0;
    totalSell += (Number(line.sell_price) || 0) * quantity;

    // cost === 0 is real pricing data; only null/undefined means the
    // operator hasn't priced the line yet.
    if (line.cost === null || line.cost === undefined) {
      unpriced++;
    } else {
      priced++;
      totalCost += line.cost * quantity;
    }
  }

  totalCost = roundToCents(totalCost);
  totalSell = roundToCents(totalSell);
  const margin = roundToCents(totalSell - totalCost);
  const marginPct =
    totalSell === 0 ? null : roundToCents((margin / totalSell) * 100);

  return {
    total_cost: totalCost,
    total_sell: totalSell,
    margin,
    margin_pct: marginPct,
    priced_lines: priced,
    unpriced_lines: unpriced,
  };
}

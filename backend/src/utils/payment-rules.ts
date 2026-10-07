/*
  The money rules — pure seam, no Medusa imports.

  One function decides how an order is paid (docs/specs/company-dashboard.md):
  - Company with invoice payment enabled: invoiced, any size or weight.
  - Unknown weight or a quote-only line anywhere: quote required.
  - 120 lbs or less (UPS parcel limit): pay in full at checkout.
  - Over 120 lbs, under $7,500: freight must be quoted.
  - Over 120 lbs, $7,500 or more: 50% deposit now, balance invoiced 30
    days after arrival. Freight on that balance follows freightAllowance()
    below (ADR-0009): allowed at $15,000+ to the contiguous US, $21,500+
    to the far lanes, otherwise added at carrier cost. $7,500 only picks
    the deposit path; it is not a free-freight promise.

  Amounts are Medusa-convention dollars as-is (49.99 = $49.99), never cents.
*/

export const MAX_PARCEL_WEIGHT_LBS = 120;
export const DEPOSIT_THRESHOLD_USD = 7_500;

/* Freight allowance (ADR-0009): the supplier's free-freight lane floors
   expressed at selling price. Published on the Shipping Policy page
   (/shipping-policy, formerly Shipping & Returns) only. */
export const FREIGHT_ALLOWANCE_USD = 15_000;
export const FREIGHT_ALLOWANCE_FAR_USD = 21_500;
/** States served from the far warehouse lane: FL, NY/NJ/DE, New England, OR, WA. */
export const FREIGHT_FAR_STATES = new Set([
  "FL", "NY", "NJ", "DE", "CT", "MA", "ME", "NH", "RI", "VT", "OR", "WA",
]);

export type FreightAllowance = "allowed" | "billed_at_cost" | "unknown";

/**
 * Whether a freight-class order ships with freight allowed or has freight
 * added at carrier cost. `shippingState` is the ship-to province code
 * (e.g. "FL"); unknown when the address has none yet.
 */
export function freightAllowance(ctx: {
  totalUsd: number;
  shippingState: string | null | undefined;
}): FreightAllowance {
  const state = ctx.shippingState?.trim().toUpperCase();
  if (!state) return "unknown";
  const threshold = FREIGHT_FAR_STATES.has(state)
    ? FREIGHT_ALLOWANCE_FAR_USD
    : FREIGHT_ALLOWANCE_USD;
  return ctx.totalUsd >= threshold ? "allowed" : "billed_at_cost";
}

export type PaymentDecision =
  | "pay_in_full"
  | "quote_required"
  | "deposit_50"
  | "invoice";

export type PaymentContext = {
  totalUsd: number;
  /** Total shipment weight; null when any line's weight is unknown. */
  totalWeightLbs: number | null;
  hasQuoteOnlyLine: boolean;
  invoiceEnabled: boolean;
};

export function decidePayment(ctx: PaymentContext): PaymentDecision {
  if (ctx.invoiceEnabled) {
    return "invoice";
  }
  if (ctx.hasQuoteOnlyLine || ctx.totalWeightLbs === null) {
    return "quote_required";
  }
  if (ctx.totalWeightLbs <= MAX_PARCEL_WEIGHT_LBS) {
    return "pay_in_full";
  }
  return ctx.totalUsd >= DEPOSIT_THRESHOLD_USD
    ? "deposit_50"
    : "quote_required";
}

export type WeighableLine = {
  /** Catalog weight; null/0 both mean "not filled in". */
  weightLbs: number | null;
  quantity: number;
};

/** Sum of weight x quantity; null when any line has no usable weight. */
export function totalOrderWeightLbs(lines: WeighableLine[]): number | null {
  let total = 0;
  for (const line of lines) {
    if (!line.weightLbs || line.weightLbs <= 0) {
      return null;
    }
    total += line.weightLbs * line.quantity;
  }
  return total;
}

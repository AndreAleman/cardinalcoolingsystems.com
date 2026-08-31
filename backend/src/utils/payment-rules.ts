/*
  The money rules — pure seam, no Medusa imports.

  One function decides how an order is paid (docs/specs/company-dashboard.md):
  - Company with invoice payment enabled: invoiced, any size or weight.
  - Unknown weight or a quote-only line anywhere: quote required.
  - 120 lbs or less (UPS parcel limit): pay in full at checkout.
  - Over 120 lbs, under $7,500: freight must be quoted.
  - Over 120 lbs, $7,500 or more: freight free -> 50% deposit now,
    balance invoiced 30 days after arrival.

  Amounts are Medusa-convention dollars as-is (49.99 = $49.99), never cents.
*/

export const MAX_PARCEL_WEIGHT_LBS = 120;
export const FREE_FREIGHT_THRESHOLD_USD = 7_500;

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
  return ctx.totalUsd >= FREE_FREIGHT_THRESHOLD_USD
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

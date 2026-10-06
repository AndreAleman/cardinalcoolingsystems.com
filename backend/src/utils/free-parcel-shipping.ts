/*
  Free parcel shipping — pure seam, no Medusa imports.

  Rule (owner, ADR-0009 "Parcel 'free shipping over $100' is unaffected"):
  parcel shipping is free when the items subtotal is $100 or more AND the
  whole shipment is a parcel, i.e. 120 lbs or less (the UPS parcel limit,
  ADR-0006). Heavier shipments are freight and keep the normal rate path.

  - Subtotal is items only: unit price x quantity, before tax, shipping and
    discounts (neither ADR nor CONTEXT says otherwise).
  - If any line has no weight we cannot tell parcel from freight, so the
    shipment is NOT free (and the caller should log it).
  - Amounts are Medusa-convention dollars as-is (49.99 = $49.99), never
    cents. (The old ShipStation code compared against 10000 "cents", which
    in dollars meant $10,000.)
*/

import { MAX_PARCEL_WEIGHT_LBS, totalOrderWeightLbs } from "./payment-rules";

export const FREE_PARCEL_SHIPPING_MIN_USD = 100;
export { MAX_PARCEL_WEIGHT_LBS };

export type ShippingLine = {
  unitPrice: number;
  quantity: number;
  /** Variant weight in lb; null/0 means "not filled in". */
  weightLbs: number | null | undefined;
};

export type FreeParcelReason =
  | "free"
  | "below_threshold"
  | "missing_weight"
  | "over_parcel_weight";

export type FreeParcelDecision = {
  free: boolean;
  reason: FreeParcelReason;
  subtotalUsd: number;
  /** null when any line has no usable weight. */
  weightLbs: number | null;
};

export function decideFreeParcelShipping(lines: ShippingLine[]): FreeParcelDecision {
  // Rounded to cents so float noise (e.g. 3 x 33.33) can't flip the rule.
  const subtotalUsd =
    Math.round(
      lines.reduce(
        (sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0),
        0
      ) * 100
    ) / 100;
  const weightLbs = totalOrderWeightLbs(
    lines.map((l) => ({
      weightLbs: l.weightLbs ? Number(l.weightLbs) : null,
      quantity: Number(l.quantity) || 0,
    }))
  );

  const decision = (free: boolean, reason: FreeParcelReason): FreeParcelDecision => ({
    free,
    reason,
    subtotalUsd,
    weightLbs,
  });

  if (subtotalUsd < FREE_PARCEL_SHIPPING_MIN_USD) return decision(false, "below_threshold");
  if (weightLbs === null) return decision(false, "missing_weight");
  if (weightLbs > MAX_PARCEL_WEIGHT_LBS) return decision(false, "over_parcel_weight");
  return decision(true, "free");
}

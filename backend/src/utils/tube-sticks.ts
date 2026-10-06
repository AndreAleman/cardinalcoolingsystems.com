/*
  Tube sticks — pure seam, no Medusa imports.

  Sanitube (supplier, Oct 2026) sells polished tube in 20 ft sticks only.
  Cut-to-length is custom fabrication and out of scope, so every tube
  quantity (priced per foot, variant metadata unit "ft") must be a
  whole number of sticks: 20, 40, 60 ... ft.

  A line is tube when any of these hold:
  - variant (or product) metadata.unit is "ft";
  - the product handle is the A270 tube product;
  - the SKU starts with AI270 or A270 (Sanitube's tube families; the four
    A270 exceptions A270P-4100/-6050/-6075/-6100 included).

  The same rule lives in both storefronts (src/lib/util/tube-sticks.ts);
  this copy backs the cart hooks and the free-parcel rule (tube always
  ships freight).
*/

export const TUBE_STICK_FT = 20;
export const TUBE_PRODUCT_HANDLE = "id-od-pol-tube-a270-3a-import";
const TUBE_SKU = /^AI?270/i;

export type TubeLike = {
  sku?: string | null;
  productHandle?: string | null;
  /** Variant metadata. */
  metadata?: Record<string, unknown> | null;
  /** Product metadata (the pricing script stamps unit "ft" there too). */
  productMetadata?: Record<string, unknown> | null;
};

export function isTubeItem(item: TubeLike | null | undefined): boolean {
  if (!item) return false;
  if (item.metadata?.unit === "ft" || item.productMetadata?.unit === "ft") return true;
  if (item.productHandle === TUBE_PRODUCT_HANDLE) return true;
  return !!item.sku && TUBE_SKU.test(item.sku.trim());
}

/** True when `quantity` (ft) is a positive whole number of sticks. */
export function isWholeSticks(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0 && quantity % TUBE_STICK_FT === 0;
}

/** Rounds a foot quantity up to whole sticks; never below one stick. */
export function roundUpToSticks(quantity: number): number {
  const q = Number(quantity) || 0;
  return Math.max(TUBE_STICK_FT, Math.ceil(q / TUBE_STICK_FT) * TUBE_STICK_FT);
}

export const TUBE_QUANTITY_MESSAGE =
  "Tube is sold in 20 ft sticks. Order tube in multiples of 20 ft (20, 40, 60 ...).";

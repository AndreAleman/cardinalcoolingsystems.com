/*
  Tube is sold in 20 ft sticks (Sanitube, Oct 2026). Tube is priced per
  foot (variant metadata unit "ft"), so every tube quantity is a whole
  number of sticks: 20, 40, 60 ... ft. Cut-to-length is custom
  fabrication, handled by quote.

  A line is tube when its variant (or product) metadata.unit is "ft", its
  product is the A270 tube product, or its SKU starts with AI270/A270.

  Quantity inputs step by 20 and anything typed rounds UP to whole sticks
  with a note saying so. The backend's cart hooks reject non-multiples, so
  every path that writes a tube quantity must round first.

  No "use client": server actions (lib/data/cart.ts) and client components
  share it. Mirrors backend/src/utils/tube-sticks.ts.
*/

export const TUBE_STICK_FT = 20
export const TUBE_PRODUCT_HANDLE = "id-od-pol-tube-a270-3a-import"
const TUBE_SKU = /^AI?270/i

type Meta = Record<string, unknown> | null | undefined

export type TubeLike = {
  sku?: string | null
  metadata?: Meta
  productHandle?: string | null
  productMetadata?: Meta
}

export function isTubeItem(item: TubeLike | null | undefined): boolean {
  if (!item) return false
  if (item.metadata?.unit === "ft" || item.productMetadata?.unit === "ft") return true
  if (item.productHandle === TUBE_PRODUCT_HANDLE) return true
  return !!item.sku && TUBE_SKU.test(item.sku.trim())
}

/* A Medusa cart line item (variant + product may or may not be expanded). */
export function isTubeLineItem(item: {
  variant_sku?: string | null
  product_handle?: string | null
  variant?: { sku?: string | null; metadata?: Meta; product?: { handle?: string | null; metadata?: Meta } | null } | null
} | null | undefined): boolean {
  if (!item) return false
  return isTubeItem({
    sku: item.variant_sku ?? item.variant?.sku,
    metadata: item.variant?.metadata,
    productHandle: item.product_handle ?? item.variant?.product?.handle,
    productMetadata: item.variant?.product?.metadata,
  })
}

/* Rounds a foot quantity up to whole sticks; never below one stick. */
export function roundUpToSticks(quantity: number): number {
  const q = Number(quantity) || 0
  return Math.max(TUBE_STICK_FT, Math.ceil(q / TUBE_STICK_FT) * TUBE_STICK_FT)
}

/* Quantity rule for any line: tube rounds up to sticks, everything else is >= 1. */
export function normalizeQuantity(quantity: number, tube: boolean): number {
  if (tube) return roundUpToSticks(quantity)
  return Math.max(1, Math.floor(Number(quantity) || 1))
}

export function quantityStep(tube: boolean): number {
  return tube ? TUBE_STICK_FT : 1
}

/* "20 ft (1 stick)", "40 ft (2 sticks)". */
export function sticksLabel(feet: number): string {
  const sticks = Math.round(feet / TUBE_STICK_FT)
  return `${feet} ft (${sticks} ${sticks === 1 ? "stick" : "sticks"})`
}

/* The note shown when a typed quantity was rounded up; null when it wasn't. */
export function roundedUpNote(requested: number, quantity: number): string | null {
  if (!Number.isFinite(requested) || requested === quantity) return null
  return `Tube is sold in 20 ft sticks, so ${requested} ft was rounded up to ${sticksLabel(quantity)}.`
}

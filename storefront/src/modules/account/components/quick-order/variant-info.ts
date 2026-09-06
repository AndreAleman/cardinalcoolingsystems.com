/*
  Shared (server- and client-usable) helpers for turning Medusa product
  variants into the row shape the Quick Order / Order Again / Favorites
  surfaces consume. No "use client" here on purpose — the buyer-portal
  server component builds these rows at render time.
*/

import { HttpTypes } from "@medusajs/types"
import type { PortalCartLine } from "./money-rules"

export type VariantRow = {
  variantId: string
  sku: string | null
  title: string
  thumbnail: string | null
  unitPrice: number | null
  currencyCode: string | null
  weight: number | null
  inventoryQuantity: number | null
  manageInventory: boolean
  requiresQuote: boolean
  available: boolean
}

/*
  Medusa serializes numeric columns inconsistently across endpoints and
  versions (weight and inventory_quantity can arrive as strings). A
  dropped number here silently flips a priced, in-stock part to
  Quote-Only, so coerce defensively: numbers and numeric strings pass,
  everything else (null, undefined, "", NaN) becomes null.
*/
function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function metadataRequiresQuote(
  meta: Record<string, unknown> | null | undefined
): boolean {
  const v = meta?.requires_quote
  return v === true || v === "true"
}

export function productVariantToRow(
  product: HttpTypes.StoreProduct,
  variant: HttpTypes.StoreProductVariant
): VariantRow {
  const calculated = (variant as any).calculated_price
  return {
    variantId: variant.id,
    sku: variant.sku ?? null,
    title: product.title ?? variant.sku ?? "Unknown part",
    thumbnail: product.thumbnail ?? null,
    unitPrice: toNumberOrNull(calculated?.calculated_amount),
    currencyCode: calculated?.currency_code ?? null,
    weight: toNumberOrNull(variant.weight),
    inventoryQuantity: toNumberOrNull((variant as any).inventory_quantity),
    manageInventory: (variant as any).manage_inventory !== false,
    requiresQuote:
      metadataRequiresQuote(product.metadata) ||
      metadataRequiresQuote(variant.metadata as any),
    available: true,
  }
}

export function rowToCartLine(row: VariantRow, qty: number): PortalCartLine {
  return {
    variantId: row.variantId,
    sku: row.sku ?? "unknown",
    title: row.title,
    thumbnail: row.thumbnail,
    qty,
    unitPrice: row.unitPrice,
    currencyCode: row.currencyCode,
    weight: row.weight,
    inventoryQuantity: row.inventoryQuantity,
    manageInventory: row.manageInventory,
    requiresQuote: row.requiresQuote,
  }
}

/* Build a variantId → row map for a set of products. */
export function buildVariantRowMap(
  products: HttpTypes.StoreProduct[]
): Record<string, VariantRow> {
  const map: Record<string, VariantRow> = {}
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      map[variant.id] = productVariantToRow(product, variant)
    }
  }
  return map
}

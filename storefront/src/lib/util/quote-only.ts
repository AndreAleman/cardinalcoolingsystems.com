import { HttpTypes } from "@medusajs/types"

/*
  Quote-Only in the public catalog (CONTEXT.md "Quote-Only Line",
  docs/adr/0001-over-stock-lines-are-quote-only.md).

  A variant can only be quoted, never added to a paid cart, when:
  - the product or variant has metadata.requires_quote true/"true"
    ("quote-only part"), or
  - it has no usable price: missing, non-numeric, or <= 0
    ("price unavailable"). A $0 price is a placeholder for parts that
    are priced per order (e.g. polished tube). It is never a real price
    and must never render as "$0.00".

  The reasons use the same words as the Quick Order's quoteOnlyReason
  (modules/account/components/quick-order/money-rules.ts). Stock and
  weight rules stay Quick-Order-only.

  No "use client" on purpose: server components (product pages,
  listings, the add-to-cart server action) and client components share it.
*/

export type CatalogQuoteOnlyReason = "quote-only part" | "price unavailable"

type AnyVariant =
  | (Partial<HttpTypes.StoreProductVariant> & { calculated_price?: any })
  | null
  | undefined

type AnyProduct =
  | Pick<HttpTypes.StoreProduct, "metadata" | "variants">
  | null
  | undefined

function metadataRequiresQuote(
  meta: Record<string, unknown> | null | undefined
): boolean {
  const v = meta?.requires_quote
  return v === true || v === "true"
}

/*
  The variant's payable unit price, or null when it has none. Medusa can
  serialize amounts as strings, so coerce: "0", 0, null, "" and NaN all
  mean "no price".
*/
export function variantUnitPrice(variant: AnyVariant): number | null {
  const raw = variant?.calculated_price?.calculated_amount
  if (raw == null || raw === "") return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function hasPayablePrice(variant: AnyVariant): boolean {
  return variantUnitPrice(variant) !== null
}

/* Variant-level metadata wins only to add the flag, never to clear it. */
export function requiresQuote(product: AnyProduct, variant?: AnyVariant): boolean {
  return (
    metadataRequiresQuote(variant?.metadata as Record<string, unknown> | null) ||
    metadataRequiresQuote(product?.metadata as Record<string, unknown> | null)
  )
}

/* Why a variant is quote-only, or null when it can be bought. */
export function catalogQuoteOnlyReason(
  product: AnyProduct,
  variant: AnyVariant
): CatalogQuoteOnlyReason | null {
  if (requiresQuote(product, variant)) return "quote-only part"
  if (!hasPayablePrice(variant)) return "price unavailable"
  return null
}

export function isVariantQuoteOnly(product: AnyProduct, variant: AnyVariant): boolean {
  return catalogQuoteOnlyReason(product, variant) !== null
}

/*
  True when no variant of the product can be bought, so listings and an
  unselected product page show "Quote only" instead of a price.
*/
export function isProductQuoteOnly(product: AnyProduct): boolean {
  if (!product) return false
  if (metadataRequiresQuote(product.metadata as Record<string, unknown> | null)) {
    return true
  }
  const variants = product.variants ?? []
  if (!variants.length) return false
  return variants.every((v) => isVariantQuoteOnly(product, v as AnyVariant))
}

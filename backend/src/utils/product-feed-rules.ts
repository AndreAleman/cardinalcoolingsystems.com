// Which variants may go into the Google Merchant Center product feed.
//
// GMC flags items with no image, no price (or a $0 price) and no shipping
// weight, and quote-only items are not allowed at all ("websites that only
// allow a customer to request a quote are not supported"). A variant is left
// out of the feed if any of these hold; everything else is unchanged.

export type FeedImageSource = {
  thumbnail?: string | null
  images?: { url?: string | null }[] | null
}

export type FeedSkipReason =
  | "quote_only"
  | "no_price"
  | "zero_price"
  | "no_image"
  | "no_weight"

const isTrue = (v: unknown) => v === true || v === "true"

/** First real image URL: variant thumbnail, product thumbnail, then product images. */
export function feedImageLink(
  variant: { thumbnail?: string | null },
  product: FeedImageSource
): string | null {
  if (variant.thumbnail) return variant.thumbnail
  if (product.thumbnail) return product.thumbnail
  const first = (product.images ?? []).find((i) => !!i?.url)
  return first?.url ?? null
}

/** Shipping weight in the unit Medusa stores (lb on this store); variant first, then product. */
export function feedShippingWeight(
  variant: { weight?: number | string | null },
  product: { weight?: number | string | null }
): number | null {
  for (const raw of [variant.weight, product.weight]) {
    const n = Number(raw)
    if (raw !== null && raw !== undefined && raw !== "" && Number.isFinite(n) && n > 0) {
      return n
    }
  }
  return null
}

export function feedSkipReason(input: {
  product: FeedImageSource & {
    metadata?: Record<string, unknown> | null
    weight?: number | string | null
  }
  variant: {
    thumbnail?: string | null
    weight?: number | string | null
    metadata?: Record<string, unknown> | null
  }
  calculatedAmount: number | string | null | undefined
}): FeedSkipReason | null {
  const { product, variant, calculatedAmount } = input

  if (isTrue(product.metadata?.requires_quote) || isTrue(variant.metadata?.requires_quote)) {
    return "quote_only"
  }

  if (calculatedAmount === null || calculatedAmount === undefined || calculatedAmount === "") {
    return "no_price"
  }
  const amount = Number(calculatedAmount)
  if (Number.isNaN(amount)) return "no_price"
  if (amount <= 0) return "zero_price"

  if (!feedImageLink(variant, product)) return "no_image"
  if (feedShippingWeight(variant, product) === null) return "no_weight"

  return null
}

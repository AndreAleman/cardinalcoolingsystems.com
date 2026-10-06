import { HttpTypes } from "@medusajs/types"
import { STAINLESS_PIPE_PRODUCT_HANDLE } from "@lib/stainless-pipe"

/*
  Stainless tubing landing page helpers
  (app/[countryCode]/(main)/stainless-steel-tubing). A270 polished tube is
  priced per foot in Medusa (see scripts/seo/apply-tube-pricing.py); schedule
  pipe is quote-only ($0, requires_quote). The size table shows the per-foot
  price where one exists and "Quote only" where it does not. The page's quote
  form takes multi-size RFQs; product pages link to it with ?sku=.
*/

/* Path without the country code; LocalizedClientLink adds it. */
export const STAINLESS_TUBE_PAGE_PATH = "/stainless-steel-tubing"

/* Form anchor on the landing page. */
export const STAINLESS_TUBE_QUOTE_ANCHOR = "quote"

/* "ID/OD Pol Tube A270 3A Import": its variants build the size table. */
export const STAINLESS_TUBE_PRODUCT_HANDLE = "id-od-pol-tube-a270-3a-import"

/* Category pages that get a link to the landing page. */
export const STAINLESS_TUBE_CATEGORY_HANDLES = ["tubes"]

export function isStainlessTubeCategory(handle: string | null | undefined): boolean {
  return !!handle && STAINLESS_TUBE_CATEGORY_HANDLES.includes(handle)
}

export function isStainlessTubeProduct(
  product: Pick<HttpTypes.StoreProduct, "handle" | "categories"> | null | undefined
): boolean {
  if (!product) return false
  if (product.handle === STAINLESS_TUBE_PRODUCT_HANDLE) return true
  /* Schedule pipe is quoted on the same page and form. */
  if (product.handle === STAINLESS_PIPE_PRODUCT_HANDLE) return true
  return (product.categories ?? []).some((c) => isStainlessTubeCategory(c?.handle))
}

/* Landing-page URL with the quote form pre-filled for one SKU. */
export function stainlessTubeQuoteHref(countryCode: string, sku?: string | null): string {
  const query = sku ? `?sku=${encodeURIComponent(sku)}` : ""
  return `/${countryCode}${STAINLESS_TUBE_PAGE_PATH}${query}#${STAINLESS_TUBE_QUOTE_ANCHOR}`
}

/* ---- Size table rows, built from the tube product's variants ---- */

export type TubeSizeRow = {
  /* e.g. 2" */
  od: string
  /* numeric OD in inches, for sorting */
  odInches: number
  /* e.g. 0.065" */
  wall: string
  /* alloy (e.g. "304L") -> SKU */
  skus: Record<string, string>
  /* alloy -> price per foot in dollars; null when the variant is quote-only */
  prices: Record<string, number | null>
}

export type TubeVariantOption = {
  sku: string
  alloy: string
  od: string
  wall: string
  label: string
  /* Per-foot price from the region-priced variant; null when $0 / missing (quote-only). */
  pricePerFt: number | null
}

/* Parses 1-1/2", 2", 12" into inches. */
export function parseInches(value: string): number {
  const clean = value.replace(/["″]/g, "").trim()
  const mixed = clean.match(/^(\d+)-(\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  const frac = clean.match(/^(\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  const n = parseFloat(clean)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

/* "T304L" -> "304L" */
export function normalizeAlloy(value: string): string {
  return value.trim().replace(/^T(?=\d)/i, "").toUpperCase()
}

function optionValue(
  variant: HttpTypes.StoreProductVariant,
  match: (title: string) => boolean
): string | null {
  const opt = (variant.options ?? []).find((o: any) =>
    match(String(o?.option?.title ?? "").toLowerCase())
  )
  return opt?.value ? String(opt.value) : null
}

export function tubeVariantOptions(
  product: HttpTypes.StoreProduct | null | undefined
): TubeVariantOption[] {
  const out: TubeVariantOption[] = []
  for (const v of product?.variants ?? []) {
    if (!v.sku) continue
    const alloyRaw = optionValue(v, (t) => t.includes("alloy") || t.includes("material"))
    const od = optionValue(v, (t) => t.includes("size") || t.includes("od"))
    const wall = optionValue(v, (t) => t.includes("wall"))
    if (!alloyRaw || !od || !wall) continue
    const alloy = normalizeAlloy(alloyRaw)
    const amount = Number((v as any).calculated_price?.calculated_amount)
    const pricePerFt = Number.isFinite(amount) && amount > 0 ? amount : null
    out.push({ sku: v.sku, alloy, od, wall, label: `${od} OD × ${wall} wall, ${alloy}`, pricePerFt })
  }
  return out.sort(
    (a, b) =>
      parseInches(a.od) - parseInches(b.od) ||
      parseFloat(a.wall) - parseFloat(b.wall) ||
      a.alloy.localeCompare(b.alloy)
  )
}

export function tubeSizeRows(options: TubeVariantOption[]): {
  rows: TubeSizeRow[]
  alloys: string[]
} {
  const byKey = new Map<string, TubeSizeRow>()
  const alloys = new Set<string>()
  for (const o of options) {
    alloys.add(o.alloy)
    const key = `${o.od}|${o.wall}`
    const row =
      byKey.get(key) ??
      ({ od: o.od, odInches: parseInches(o.od), wall: o.wall, skus: {}, prices: {} } as TubeSizeRow)
    row.skus[o.alloy] = o.sku
    row.prices[o.alloy] = o.pricePerFt
    byKey.set(key, row)
  }
  const rows = Array.from(byKey.values()).sort(
    (a, b) => a.odInches - b.odInches || parseFloat(a.wall) - parseFloat(b.wall)
  )
  return { rows, alloys: Array.from(alloys).sort() }
}

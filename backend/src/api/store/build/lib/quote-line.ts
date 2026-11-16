// Pure builders for the cart lines POST /store/build/quote-lines adds (plan B3).
// Everything here comes from a fresh server-side resolve: values sent by the client are ignored.

import { createHash } from "node:crypto"
import { getBuilder, type DisplayRow, type Options } from "../../../../lib/cpq-shared"
import type { BuilderLineMetadata } from "../../../../utils/builder-quote-line"
import type { ResolveResult, ResolvedBomLine } from "./resolver"

/** Deterministic Configuration id: the same config_key always gets the same id (B5 upsert). */
export function configurationIdFor(configKey: string): string {
  return "bcfg_" + createHash("sha256").update(configKey).digest("hex").slice(0, 26).toUpperCase()
}

/** The option key that holds a builder's quantity; the row manifold has none (units = pair). */
export const UNITS_KEY: Readonly<Record<string, string | null>> = {
  "cdu-kit": "units",
  transition: "qty",
  strainer: "qty",
  hose: "qty",
  "row-manifold": null,
}

/**
 * Applies the body's `units` to the builder's quantity key before decoding. Returns the raw
 * options to decode and whether `units` could not be applied (row manifold).
 */
export function withUnits(
  builder_type: string,
  options: Record<string, unknown>,
  units: number | undefined
): { options: Record<string, unknown>; unitsIgnored: boolean } {
  if (units === undefined) return { options, unitsIgnored: false }
  const key = UNITS_KEY[builder_type]
  if (!key) return { options, unitsIgnored: true }
  return { options: { ...options, [key]: units }, unitsIgnored: false }
}

export type QuoteLineItemInput = {
  title: string
  subtitle: string
  product_title: string
  variant_sku: string
  quantity: number
  unit_price: 0
  requires_shipping: true
  is_discountable: false
  metadata: BuilderLineMetadata
}

/** configuration_display: Part Number first, then the builder's rows, then any review flags. */
export function configurationDisplay(r: ResolveResult): DisplayRow[] {
  const b = getBuilder(r.builder_type as string)
  const rows: DisplayRow[] = [{ label: "Part Number", value: r.part_number }, ...b.display(r.options as Options)]
  if (!r.standard_range.ok) {
    rows.push({ label: "Engineering review", value: r.standard_range.reasons.map((x) => x.message).join("; ") })
  }
  return rows
}

/** The one custom line a Quote-mode configuration becomes (B3). */
export function quoteLineItem(
  r: ResolveResult,
  configuration_id: string,
  source_page: string | null
): QuoteLineItemInput {
  const b = getBuilder(r.builder_type as string)
  return {
    title: r.description,
    subtitle: `Part Number ${r.part_number}`,
    product_title: b.title,
    variant_sku: r.part_number,
    quantity: r.units,
    unit_price: 0,
    requires_shipping: true,
    is_discountable: false,
    metadata: {
      builder: true,
      builder_type: r.builder_type,
      configuration: r.options,
      configuration_display: configurationDisplay(r),
      part_number: r.part_number,
      pricing_mode: "quote",
      lead_time: r.lead_time,
      configuration_id,
      config_key: r.config_key,
      share_path: r.share_path,
      quote_reasons: r.quote_reasons,
      source_page,
    },
  }
}

export type InstantLinePlan = {
  variant_id: string
  sku: string
  quantity: number
  /** Over stock once the cart's existing quantity is counted: goes in as a quote-only line. */
  over_stock: boolean
  title: string
}

/**
 * Instant lines to add. Quantities are summed per variant (two roles may share a SKU) and checked
 * against stock including what the cart already holds; a line that would exceed stock is still
 * added, as a quote-only line (ADR-0001).
 */
export function planInstantLines(
  bom: ResolvedBomLine[],
  cartQtyByVariant: ReadonlyMap<string, number>
): InstantLinePlan[] {
  const byVariant = new Map<string, { line: ResolvedBomLine; qty: number }>()
  for (const l of bom) {
    if (!l.resolved || !l.variant_id || !l.sku) continue
    const cur = byVariant.get(l.variant_id)
    if (cur) cur.qty += l.qty_total
    else byVariant.set(l.variant_id, { line: l, qty: l.qty_total })
  }
  return [...byVariant.values()].map(({ line, qty }) => {
    const inCart = cartQtyByVariant.get(line.variant_id as string) ?? 0
    const over = line.stock_qty !== null && inCart + qty > line.stock_qty
    return { variant_id: line.variant_id as string, sku: line.sku as string, quantity: qty, over_stock: over, title: line.label }
  })
}

/** Metadata stamped on an Instant line so the cart and admin can tell which configuration it came from. */
export function instantLineMetadata(r: ResolveResult, configuration_id: string, source_page: string | null) {
  return {
    builder: true,
    builder_type: r.builder_type,
    part_number: r.part_number,
    pricing_mode: "instant" as const,
    configuration_id,
    source_page,
  }
}

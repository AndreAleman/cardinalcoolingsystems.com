// Pure resolver for POST /store/build/resolve (Cardinal Builder plan B1, B2, ADR-0011).
// No Medusa imports: the route loads the catalog facts (catalog.ts) and the price basis
// (price-basis.ts) and hands them in, so every pricing rule here is unit-tested.
//
// B1: a BOM line is Instant only when it resolves to a published variant with a price > 0,
// a weight, and stock ≥ the total quantity (or inventory not managed). The resolver takes the
// FIRST CANDIDATE THAT RESOLVES, not the first that exists (14AM76-600 has 0 in stock while
// 14WMP6-600 is stocked). Any unresolved or fabricated line makes the configuration Quote.

import {
  getBuilder,
  leadTimeOf,
  QUOTE_PROMISE,
  roundLb,
  totalLb,
  type BomLine,
  type BuilderType,
  type LeadTime,
  type Options,
  type ReviewReason,
} from "../../../../lib/cpq-shared"

/** What the store knows about one variant, priced for the caller's basis. */
export type VariantFacts = {
  sku: string
  variant_id: string
  /** Product is published and neither it nor the variant is deleted. */
  published: boolean
  /** calculated_price.calculated_amount in the US region (dollars), null = no price. */
  unit_price: number | null
  weight_lb: number | null
  manage_inventory: boolean
  /** Available quantity in the store's sales channel; null when unknown. */
  stock_qty: number | null
}

/** Variant facts by SKU. */
export type Catalog = ReadonlyMap<string, VariantFacts>

export type PriceBasis = "company" | "list"

export type ResolvedBomLine = {
  role: string
  label: string
  sku: string | null
  variant_id: string | null
  qty_per_unit: number
  qty_total: number
  unit_price: number | null
  line_total: number | null
  in_stock: boolean | null
  stock_qty: number | null
  weight_lb: number | null
  lead_time: "stock" | "custom"
  resolved: boolean
  /** Why the line is not Instant; null when resolved. */
  reason: string | null
  kind: "sku" | "fabricated"
  part_number?: string
  note?: string
}

export type StockedAlternative = { sku: string; variant_id: string; unit_price: number }

export type ResolveResult = {
  builder_type: BuilderType
  options: Options
  ignored: string[]
  config_key: string
  share_path: string
  part_number: string
  description: string
  pricing_mode: "instant" | "quote"
  quote_reasons: string[]
  bom: ResolvedBomLine[]
  units: number
  price_per_unit: number | null
  price_total: number | null
  currency_code: "usd"
  price_basis: PriceBasis
  priced_at: string
  /** Rounded once to 0.1 lb (shared roundLb), as the page and the drawing show it. */
  weight_lb_per_unit: number
  /** weight_lb_per_unit × units (shared totalLb): a pair is exactly 2 × one manifold. */
  weight_lb_total: number
  lead_time: LeadTime
  /** Shown with every Quote-mode configuration; null when Instant. */
  quote_promise: string | null
  standard_range: { ok: boolean; reasons: ReviewReason[] }
  spec_block: string
  /** Additive (transition): the stocked adapter that does the same job, when it resolves. */
  stocked_alternative: StockedAlternative | null
}

export type CandidateCheck = { ok: boolean; reason?: string }

export const roundCents = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

/** B1 check of one existing variant against the quantity the configuration needs. */
export function checkCandidate(v: VariantFacts, qtyTotal: number): CandidateCheck {
  if (!v.published) return { ok: false, reason: `${v.sku} is not published` }
  if (v.unit_price === null || !(v.unit_price > 0)) return { ok: false, reason: `${v.sku} has no price` }
  if (v.weight_lb === null || !(v.weight_lb > 0)) return { ok: false, reason: `${v.sku} has no weight on file` }
  if (v.manage_inventory) {
    const stock = v.stock_qty ?? 0
    if (stock < qtyTotal) return { ok: false, reason: `${v.sku}: ${Math.max(0, stock)} in stock, ${qtyTotal} needed` }
  }
  return { ok: true }
}

export type CandidateSelection = {
  /** The resolving variant, or the best existing candidate when none resolves. */
  variant: VariantFacts | null
  resolved: boolean
  reason: string | null
}

/**
 * First candidate that resolves; otherwise the first existing candidate with its reason;
 * otherwise "not stocked". A fabricated line never resolves.
 */
export function selectCandidate(line: BomLine, qtyTotal: number, catalog: Catalog): CandidateSelection {
  if (line.kind === "fabricated") {
    return { variant: null, resolved: false, reason: `Made to order: ${line.label}` }
  }
  let best: { variant: VariantFacts; reason: string } | null = null
  for (const sku of line.candidates) {
    const v = catalog.get(sku)
    if (!v) continue
    const check = checkCandidate(v, qtyTotal)
    if (check.ok) return { variant: v, resolved: true, reason: null }
    if (!best) best = { variant: v, reason: check.reason as string }
  }
  if (best) return { variant: best.variant, resolved: false, reason: best.reason }
  return { variant: null, resolved: false, reason: `Not stocked: ${line.label}` }
}

export function resolveLine(line: BomLine, units: number, catalog: Catalog): ResolvedBomLine {
  const qty_total = line.qty_per_unit * units
  const sel = selectCandidate(line, qty_total, catalog)
  const v = sel.variant
  const unit_price = v && v.unit_price !== null && v.unit_price > 0 ? v.unit_price : null
  const out: ResolvedBomLine = {
    role: line.role,
    label: line.label,
    sku: v?.sku ?? null,
    variant_id: v?.variant_id ?? null,
    qty_per_unit: line.qty_per_unit,
    qty_total,
    unit_price,
    line_total: unit_price !== null ? roundCents(unit_price * qty_total) : null,
    in_stock: v ? (v.manage_inventory ? (v.stock_qty ?? 0) >= qty_total : true) : null,
    stock_qty: v ? (v.manage_inventory ? v.stock_qty ?? 0 : null) : null,
    weight_lb: v?.weight_lb ?? null,
    lead_time: sel.resolved ? "stock" : "custom",
    resolved: sel.resolved,
    reason: sel.reason,
    kind: line.kind,
  }
  if (line.part_number !== undefined) out.part_number = line.part_number
  if (line.note !== undefined) out.note = line.note
  return out
}

/** Every SKU the resolver may look up for a configuration (BOM candidates + stocked alternative). */
export function candidateSkus(builder_type: string, options: Options): string[] {
  const b = getBuilder(builder_type as string)
  const lines = [...b.bom(options).lines]
  const alt = b.stockedAlternative?.(options)
  if (alt) lines.push(alt)
  const out = new Set<string>()
  for (const l of lines) for (const c of l.candidates) out.add(c)
  return [...out]
}

export type ResolveInput = {
  builder_type: BuilderType
  /** Canonical options (from the builder's forgiving decode). */
  options: Options
  ignored: string[]
  catalog: Catalog
  price_basis: PriceBasis
  /** ISO date of the resolve (YYYY-MM-DD). */
  priced_at: string
}

export function resolveConfiguration(input: ResolveInput): ResolveResult {
  const { builder_type, options, catalog } = input
  const b = getBuilder(builder_type as string)
  const bom = b.bom(options)
  const units = bom.units

  const base = {
    builder_type,
    options,
    ignored: input.ignored,
    config_key: b.configKey(options),
    share_path: b.sharePath(options),
    part_number: b.partNumber(options),
    description: b.describe(options),
    units,
    currency_code: "usd" as const,
    price_basis: input.price_basis,
    priced_at: input.priced_at,
    standard_range: (() => {
      const r = b.standardRange(options)
      return { ok: r.ok, reasons: r.reasons }
    })(),
    spec_block: b.specBlock(options),
  }

  // Transition shortcut: a stocked adapter that resolves prices the job Instant.
  const altLine = b.stockedAlternative?.(options) ?? null
  if (altLine) {
    const alt = resolveLine(altLine, units, catalog)
    if (alt.resolved && alt.sku && alt.variant_id && alt.unit_price !== null) {
      const perUnit = roundCents(alt.unit_price * alt.qty_per_unit)
      return {
        ...base,
        pricing_mode: "instant",
        quote_reasons: [],
        bom: [alt],
        price_per_unit: perUnit,
        price_total: roundCents(perUnit * units),
        weight_lb_per_unit: roundLb((alt.weight_lb ?? 0) * alt.qty_per_unit),
        weight_lb_total: totalLb((alt.weight_lb ?? 0) * alt.qty_per_unit, units),
        lead_time: leadTimeOf("stock"),
        quote_promise: null,
        stocked_alternative: { sku: alt.sku, variant_id: alt.variant_id, unit_price: alt.unit_price },
      }
    }
  }

  const lines = bom.lines.map((l) => resolveLine(l, units, catalog))
  const quote_reasons = lines.filter((l) => !l.resolved).map((l) => l.reason as string)
  const totals = instantTotals(lines, units)
  const instant = totals !== null

  return {
    ...base,
    pricing_mode: instant ? "instant" : "quote",
    quote_reasons: dedupe(quote_reasons),
    bom: lines,
    price_per_unit: totals?.price_per_unit ?? null,
    price_total: totals?.price_total ?? null,
    weight_lb_per_unit: roundLb(b.weight(options).per_unit_lb),
    weight_lb_total: totalLb(b.weight(options).per_unit_lb, units),
    lead_time: leadTimeOf(instant ? "stock" : "custom"),
    quote_promise: instant ? null : QUOTE_PROMISE,
    stocked_alternative: null,
  }
}

/**
 * Instant totals: only when every line resolved (B1, ADR-0011: never a partial price).
 * price_per_unit = Σ unit_price × qty_per_unit; price_total = price_per_unit × units.
 */
export function instantTotals(
  lines: Pick<ResolvedBomLine, "resolved" | "unit_price" | "qty_per_unit">[],
  units: number
): { price_per_unit: number; price_total: number } | null {
  if (!lines.length || lines.some((l) => !l.resolved || l.unit_price === null)) return null
  const perUnit = roundCents(lines.reduce((s, l) => s + (l.unit_price as number) * l.qty_per_unit, 0))
  return { price_per_unit: perUnit, price_total: roundCents(perUnit * units) }
}

function dedupe(xs: string[]): string[] {
  return xs.filter((x, i) => xs.indexOf(x) === i)
}

/** Today's date in Cardinal's business day (America/New_York, Miami; plan B7) as YYYY-MM-DD. */
export function isoDate(d: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

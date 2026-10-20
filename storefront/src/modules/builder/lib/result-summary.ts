// The result line under the headline (David's review, Oct 20): one live sentence, count first.
//   "4 CDUs · 8 hoses, 24 ferrules, 16 clamps, 16 gaskets · $1,234.00 in stock, ships in 1–2 business days"
//   "4 CDUs · 8 spools, 24 ferrules, … · Firm quote within 1 business day, held 90 days · custom production, 3–6 weeks"
// Pure; unit-tested in __tests__/result-summary.test.ts.
//
// ADAPTER: the core stream is adding a shared `resultSummary(builderType, options, bom, pricing)`
// helper in shared/cpq. Until it lands this derives the same sentence from what the page already
// has (the resolve response's bom/units/price_total/pricing_mode/lead_time, via PricingView). When
// it lands, `resultSummary` below should delegate to it and keep only the segment shape the
// ResultLine component renders. The price is only ever the resolve's (PricingView, B1): a loading
// resolve gives `price.kind === "loading"` (a skeleton), never a number.

import type { BuilderType, Options } from "@lib/cpq/shared"
import type { PricingView } from "@lib/builder/pricing-view"
import type { ResolveResponse } from "@lib/builder/types"
import { unitNoun } from "@lib/builder/state"
import { convertToLocale } from "@lib/util/money"

/** The BOM fields the summary reads: a resolved line or a local line with its total quantity. */
export type SummaryBomLine = { role: string; qty_total: number }

export type ResultPrice =
  | { kind: "price"; amount: string; rest: string }
  | { kind: "quote"; promise: string; lead: string }
  | { kind: "loading" }

export type ResultSummary = {
  /** "4 CDUs" (the number the eye lands on first). */
  units: string
  /** "8 hoses, 24 ferrules, 16 clamps, 16 gaskets" or a builder-specific short description. */
  contents: string
  price: ResultPrice
  /** The whole sentence as plain text (aria-label, tests). "" parts are skipped. */
  text: string
}

// Kit BOM roles → noun (prefix match on the role family: gasket_epdm → gasket).
const ROLE_NOUN: [prefix: string, one: string, many: string][] = [
  ["hose", "hose", "hoses"],
  ["spool", "spool", "spools"],
  ["ferrule", "ferrule", "ferrules"],
  ["clamp", "clamp", "clamps"],
  ["gasket", "gasket", "gaskets"],
  ["valve", "valve", "valves"],
  ["strainer", "strainer", "strainers"],
  ["adapter", "adapter", "adapters"],
]

function nounOf(role: string): [string, string] | null {
  const hit = ROLE_NOUN.find(([p]) => role === p || role.startsWith(`${p}_`))
  return hit ? [hit[1], hit[2]] : null
}

/** "8 hoses, 24 ferrules, 16 clamps, 16 gaskets": BOM order, same noun summed. */
export function kitContents(bom: readonly SummaryBomLine[]): string {
  const totals = new Map<string, { n: number; one: string; many: string }>()
  for (const l of bom) {
    const noun = nounOf(l.role)
    if (!noun || !(l.qty_total > 0)) continue
    const t = totals.get(noun[0]) ?? { n: 0, one: noun[0], many: noun[1] }
    t.n += l.qty_total
    totals.set(noun[0], t)
  }
  return [...totals.values()].map((t) => `${t.n} ${t.n === 1 ? t.one : t.many}`).join(", ")
}

/** Nominal size in decimal inches, as buyers say it: 150 → 1.5", 400 → 4". */
export const sizeLabel = (code: unknown): string => {
  const n = Number(code)
  return Number.isFinite(n) && n > 0 ? `${n / 100}"` : String(code)
}

function contentsOf(type: BuilderType, options: Options, bom: readonly SummaryBomLine[], stockedSku?: string | null): string {
  const o = options as Record<string, unknown>
  switch (type) {
    case "cdu-kit":
      return kitContents(bom)
    case "row-manifold":
      return `${o.drops} × ${sizeLabel(o.drop)} drops at ${o.pitch}" on a ${sizeLabel(o.header)} header`
    case "transition":
      if (stockedSku) return `stocked adapter ${stockedSku}`
      return `${sizeLabel(o.od)}${Number(o.odb) !== Number(o.od) ? ` × ${sizeLabel(o.odb)}` : ""}, ${o.len}" long`
    case "strainer":
      return `${sizeLabel(o.size)}, ${o.mesh} mesh`
    case "hose":
      return `${sizeLabel(o.size)} × ${o.len}"`
  }
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s)

function priceOf(view: PricingView): ResultPrice {
  const p = view.price
  if (p.kind === "price") {
    return {
      kind: "price",
      amount: convertToLocale({ amount: p.total, currency_code: p.currency }),
      rest: `in stock, ${lowerFirst(view.leadTime)}`,
    }
  }
  if (p.kind === "quote") return { kind: "quote", promise: p.promise, lead: lowerFirst(view.leadTime) }
  return { kind: "loading" }
}

/**
 * The result line. `bom` is the resolve's BOM when it has answered, otherwise the local BOM with
 * `qty_total` (the counts are known before the price is). `view` is the page's PricingView.
 */
export function resultSummary(input: {
  builderType: BuilderType
  options: Options
  units: number
  bom: readonly SummaryBomLine[]
  view: PricingView
  /** Transition: the stocked adapter that replaced the spool, when the resolve found one. */
  stockedSku?: string | null
}): ResultSummary {
  const { builderType, options, units, bom, view, stockedSku } = input
  const u = `${units} ${unitNoun(builderType, units)}`
  const contents = contentsOf(builderType, options, bom, stockedSku)
  const price = priceOf(view)
  const priceText =
    price.kind === "price"
      ? `${price.amount} ${price.rest}`
      : price.kind === "quote"
        ? `${price.promise} · ${price.lead}`
        : ""
  const text = [u, contents, priceText].filter((s) => s.trim() !== "").join(" · ")
  return { units: u, contents, price, text }
}

/** The summary's BOM input from a resolve response, or from a local BOM (qty per unit × units). */
export function summaryBom(
  resolved: Pick<ResolveResponse, "bom"> | null,
  local: { lines: readonly { role: string; qty_per_unit: number }[]; units: number },
): SummaryBomLine[] {
  if (resolved) return resolved.bom.map((l) => ({ role: l.role, qty_total: l.qty_total }))
  return local.lines.map((l) => ({ role: l.role, qty_total: l.qty_per_unit * local.units }))
}

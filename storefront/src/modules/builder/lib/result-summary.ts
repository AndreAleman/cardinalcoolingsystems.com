// The result line under the headline (David's review, Oct 20): one live sentence, count first.
//   "4 CDUs · 8 hoses, 8 ferrules, 16 clamps, 16 gaskets · $1,234.00 in stock, ships in 1–2 business days"
//   "4 CDUs · 8 spools, 8 ferrules, … · Firm quote within 1 business day, held 90 days · custom production, 3–6 weeks"
// Pure; unit-tested in __tests__/result-summary.test.ts.
//
// ADAPTER over the shared `resultSummary(builderType, options, bom, pricing)` (shared/cpq), so the
// storefront and the backend say the same thing. This file only shapes it into the segments the
// ResultLine component renders and formats the money. The price is only ever the resolve's
// `price_total` (B1): a pending resolve gives `price.kind === "loading"` (a skeleton), and an
// Instant answer without a usable total reads as Quote, never as a made-up number.

import {
  resultSummary as sharedResultSummary,
  type BuilderType,
  type Options,
  type ResultSummaryBom,
  type ResultSummaryPricing,
} from "@lib/cpq/shared"
import type { ResolveStatus } from "@lib/builder/pricing-view"
import type { ResolveResponse } from "@lib/builder/types"
import { convertToLocale } from "@lib/util/money"

export type ResultPrice =
  | { kind: "price"; amount: string; rest: string }
  | { kind: "quote"; promise: string; lead: string }
  | { kind: "loading" }

export type ResultSummary = {
  /** "4 CDUs" (the number the eye lands on first). */
  units: string
  /** "8 hoses, 8 ferrules, 16 clamps, 16 gaskets" or a builder-specific short description. */
  contents: string
  price: ResultPrice
  /** The whole sentence as plain text (aria-label, tests). "" parts are skipped. */
  text: string
}

/** Nominal size in decimal inches, as buyers say it: 150 → 1.5", 400 → 4". */
export const sizeLabel = (code: unknown): string => {
  const n = Number(code)
  return Number.isFinite(n) && n > 0 ? `${n / 100}"` : String(code)
}

/** For builders whose shared summary has no parts list (fabricated: manifold, transition). */
function shortDescription(type: BuilderType, options: Options, stockedSku?: string | null): string {
  const o = options as Record<string, unknown>
  switch (type) {
    case "row-manifold":
      return `${o.drops} × ${sizeLabel(o.drop)} drops at ${o.pitch}" on a ${sizeLabel(o.header)} header`
    case "transition":
      if (stockedSku) return `stocked adapter ${stockedSku}`
      return `${sizeLabel(o.od)}${Number(o.odb) !== Number(o.od) ? ` × ${sizeLabel(o.odb)}` : ""}, ${o.len}" long`
    case "strainer":
      return `${sizeLabel(o.size)}, ${o.mesh} mesh`
    case "hose":
      return `${sizeLabel(o.size)} × ${o.len}"`
    default:
      return ""
  }
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s)
const positive = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n > 0

/**
 * The resolve's verdict for the shared summary: null while pending; Quote when the resolve failed
 * (as the Part Number card says) or answered Instant without a usable total.
 */
export function summaryPricing(status: ResolveStatus, result: ResolveResponse | null): ResultSummaryPricing {
  if (status === "done" && result) {
    return result.pricing_mode === "instant" && positive(result.price_total)
      ? { pricing_mode: "instant", price_total: result.price_total }
      : { pricing_mode: "quote", price_total: null }
  }
  if (status === "error") return { pricing_mode: "quote", price_total: null }
  return null
}

/** The shared summary's BOM from a resolve response (its lines and units), or null for the local BOM. */
export function summaryBom(result: Pick<ResolveResponse, "bom" | "units"> | null): ResultSummaryBom | null {
  return result ? { lines: result.bom, units: result.units } : null
}

export function resultSummary(input: {
  builderType: BuilderType
  options: Options
  status: ResolveStatus
  /** The resolve response for the current configuration, or null while it is pending. */
  result: ResolveResponse | null
  /** Transition: the stocked adapter that replaced the spool, when the resolve found one. */
  stockedSku?: string | null
}): ResultSummary {
  const { builderType, options, status, result, stockedSku } = input
  const done = status === "done" ? result : null
  const s = sharedResultSummary(builderType, options, summaryBom(done), summaryPricing(status, result))

  const contents = (!stockedSku && s.parts_label) || shortDescription(builderType, options, stockedSku)
  let price: ResultPrice = { kind: "loading" }
  if (s.pricing_mode === "instant" && s.price_total !== null) {
    price = {
      kind: "price",
      amount: convertToLocale({ amount: s.price_total, currency_code: done?.currency_code || "usd" }),
      rest: `in stock, ${lowerFirst(s.lead_label)}`,
    }
  } else if (s.pricing_mode === "quote") {
    price = { kind: "quote", promise: s.quote_promise ?? "", lead: lowerFirst(s.lead_label) }
  }
  const priceText =
    price.kind === "price" ? `${price.amount} ${price.rest}` : price.kind === "quote" ? `${price.promise} · ${price.lead}` : ""
  const text = [s.units_label, contents, priceText].filter((x) => x.trim() !== "").join(" · ")
  return { units: s.units_label, contents, price, text }
}

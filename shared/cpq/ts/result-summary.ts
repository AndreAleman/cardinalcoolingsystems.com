// The one-line result under a builder's headline, as data, so the storefront and the backend say
// the same thing:
//   "4 CDUs · 8 hoses, 8 ferrules, 16 clamps, 16 gaskets · $X in stock, ships in 1–2 business days"
//   "8 spools · firm quote within 1 business day"
// Pure: the caller formats money and joins the pieces.

import { getBuilder } from "./builders"
import { leadTimeOf, QUOTE_PROMISE } from "./bom-lines"
import type { BuilderType, LeadTimeKind, Options } from "./types"

/** A BOM line as either the shared BOM or the resolve response carries it. */
export type ResultSummaryLine = { role: string; qty_per_unit: number; lead_time?: LeadTimeKind }
export type ResultSummaryBom = { lines: readonly ResultSummaryLine[]; units: number }

/** The resolve's verdict; null while it is pending (or failed). */
export type ResultSummaryPricing = { pricing_mode: "instant" | "quote"; price_total: number | null } | null

export type ResultSummaryPart = {
  /** Part group: "spool", "hose", "ferrule", "clamp", "gasket", "valve", "strainer", "adapter", "cap", "reducer". */
  key: string
  /** Noun for `qty` ("hoses", "1 clamp" → "clamp"). */
  label: string
  /** Total over every unit (qty_per_unit × units, summed over the group's lines). */
  qty: number
}

export type ResultSummary = {
  units: number
  /** "4 CDUs", "2 manifolds", "1 spool". */
  units_label: string
  /** In BOM order; empty for a fabricated breakdown (manifold, transition). */
  parts: ResultSummaryPart[]
  /** "8 hoses, 8 ferrules, 16 clamps, 16 gaskets", or "" with no parts. */
  parts_label: string
  /** The Instant total; null in Quote mode or while pricing is unknown (never a made-up price). */
  price_total: number | null
  /** null while the resolve is pending: Quote is known up front only when a line is custom. */
  pricing_mode: "instant" | "quote" | null
  /** assemblies.json lead_time: "Ships in 1–2 business days" | "Custom production, 3–6 weeks". */
  lead_label: string
  /** "Firm quote within 1 business day, held 90 days" in Quote mode, else null. */
  quote_promise: string | null
}

const GROUPS: readonly { key: string; one: string; many: string; match: (role: string) => boolean }[] = [
  { key: "spool", one: "spool", many: "spools", match: (r) => r === "spool" },
  { key: "hose", one: "hose", many: "hoses", match: (r) => r === "hose" },
  { key: "ferrule", one: "ferrule", many: "ferrules", match: (r) => r === "ferrule" || r.indexOf("ferrule_") === 0 },
  { key: "clamp", one: "clamp", many: "clamps", match: (r) => r === "clamp" },
  { key: "gasket", one: "gasket", many: "gaskets", match: (r) => r.indexOf("gasket_") === 0 },
  { key: "valve", one: "valve", many: "valves", match: (r) => r.indexOf("valve_") === 0 },
  { key: "strainer", one: "strainer", many: "strainers", match: (r) => r === "strainer" },
  { key: "adapter", one: "adapter", many: "adapters", match: (r) => r.indexOf("adapter_") === 0 },
  { key: "cap", one: "cap", many: "caps", match: (r) => r.indexOf("cap_") === 0 },
  { key: "reducer", one: "reducer", many: "reducers", match: (r) => r.indexOf("reducer_") === 0 },
]

/**
 * The result line of a configuration. `bom` is the shared BOM or the resolve response's
 * `{ lines: bom, units }`; omitted, it is built from `options`. `pricing` is the resolve's verdict,
 * or null while it is pending.
 */
export function resultSummary(
  builderType: BuilderType,
  options: Options,
  bom?: ResultSummaryBom | null,
  pricing: ResultSummaryPricing = null,
): ResultSummary {
  const b = getBuilder(builderType as string)
  const theBom: ResultSummaryBom = bom ?? b.bom(options)
  const units = theBom.units
  const units_label = `${units} ${units === 1 ? b.unitNoun.one : b.unitNoun.many}`

  const parts: ResultSummaryPart[] = []
  if (b.summaryParts) {
    const exclude = b.summaryParts.exclude
    for (const l of theBom.lines) {
      if (exclude.indexOf(l.role) >= 0) continue
      const g = GROUPS.find((x) => x.match(l.role))
      if (!g) continue // tube cuts, documents, fabricated ends
      const qty = l.qty_per_unit * units
      const p = parts.find((x) => x.key === g.key)
      if (p) p.qty += qty
      else parts.push({ key: g.key, label: "", qty })
    }
    for (const p of parts) {
      const g = GROUPS.find((x) => x.key === p.key)!
      p.label = p.qty === 1 ? g.one : g.many
    }
  }

  // Before the resolve answers, Quote is certain only when a line is custom (welded, cut, unstocked).
  const staticKind: LeadTimeKind = theBom.lines.some((l) => l.lead_time === "custom") ? "custom" : "stock"
  const pricing_mode = pricing ? pricing.pricing_mode : staticKind === "custom" ? "quote" : null
  const leadKind: LeadTimeKind = pricing_mode === "instant" ? "stock" : pricing_mode === "quote" ? "custom" : staticKind
  return {
    units,
    units_label,
    parts,
    parts_label: parts.map((p) => `${p.qty} ${p.label}`).join(", "),
    price_total: pricing && pricing.pricing_mode === "instant" ? pricing.price_total : null,
    pricing_mode,
    lead_label: leadTimeOf(leadKind).label,
    quote_promise: pricing_mode === "quote" ? QUOTE_PROMISE : null,
  }
}

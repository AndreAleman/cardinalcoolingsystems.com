import { describe, expect, it } from "vitest"
import { DEFAULT_CDU_KIT_OPTIONS, DEFAULT_ROW_MANIFOLD_OPTIONS, getBuilder, QUOTE_PROMISE, type Options } from "@lib/cpq/shared"
import type { ResolveResponse } from "@lib/builder/types"
import { resultSummary, summaryPricing } from "../result-summary"

const kit = (over: Record<string, unknown>) => ({ ...DEFAULT_CDU_KIT_OPTIONS, ...over }) as unknown as Options

/** A resolve response built from the shared BOM, priced or quoted. */
function resolved(type: string, o: Options, mode: "instant" | "quote", total: number | null): ResolveResponse {
  const b = getBuilder(type).bom(o)
  return {
    bom: b.lines.map((l) => ({ ...l, qty_total: l.qty_per_unit * b.units })),
    units: b.units,
    pricing_mode: mode,
    price_total: total,
    price_per_unit: total === null ? null : total / b.units,
    currency_code: "usd",
  } as unknown as ResolveResponse
}

describe("resultSummary (adapter over the shared resultSummary)", () => {
  it("instant: count first, contents, the resolve's price_total and the stock lead time", () => {
    const o = kit({ run: "hose", units: 4 })
    const s = resultSummary({ builderType: "cdu-kit", options: o, status: "done", result: resolved("cdu-kit", o, "instant", 1234) })
    expect(s.units).toBe("4 CDUs")
    expect(s.contents).toMatch(/^8 hoses, \d+ ferrules?, 16 clamps, 16 gaskets$/)
    expect(s.price).toEqual({ kind: "price", amount: "$1,234.00", rest: "in stock, ships in 1–2 business days" })
    expect(s.text).toBe(`4 CDUs · ${s.contents} · $1,234.00 in stock, ships in 1–2 business days`)
  })

  it("quote: the promise and lead time, never a price", () => {
    const o = kit({ run: "hard", units: 4 })
    const s = resultSummary({ builderType: "cdu-kit", options: o, status: "done", result: resolved("cdu-kit", o, "quote", null) })
    expect(s.contents.startsWith("8 spools")).toBe(true)
    expect(s.price).toEqual({ kind: "quote", promise: QUOTE_PROMISE, lead: "custom production, 3–6 weeks" })
    expect(s.text).not.toMatch(/\$/)
  })

  it("an Instant answer without a usable total reads as Quote (never a made-up price)", () => {
    const o = kit({ run: "hose", units: 2 })
    const s = resultSummary({ builderType: "cdu-kit", options: o, status: "done", result: resolved("cdu-kit", o, "instant", null) })
    expect(s.price.kind).toBe("quote")
    expect(s.text).not.toMatch(/\$/)
  })

  it("loading with a custom line (an assembled hose) is Quote up front, as the badge is", () => {
    const o = kit({ run: "hose", units: 1 })
    const s = resultSummary({ builderType: "cdu-kit", options: o, status: "loading", result: null })
    expect(s.units).toBe("1 CDU")
    expect(s.price.kind).toBe("quote")
    expect(s.text).not.toMatch(/\$/)
  })

  it("a failed resolve reads as Quote, as the Part Number card does", () => {
    expect(summaryPricing("error", null)).toEqual({ pricing_mode: "quote", price_total: null })
    expect(summaryPricing("loading", null)).toBeNull()
  })

  it("manifold and transition get a short description", () => {
    const m = resultSummary({ builderType: "row-manifold", options: DEFAULT_ROW_MANIFOLD_OPTIONS as unknown as Options, status: "loading", result: null })
    expect(m.text).toMatch(/^2 manifolds · 12 × 1" drops at 24" on a 4" header · Firm quote/)
    const to = getBuilder("transition").decode(null).options
    const alt = { bom: [{ role: "adapter_flg", qty_per_unit: 1, lead_time: "stock" }], units: 1, pricing_mode: "instant", price_total: 319.39, currency_code: "usd" } as unknown as ResolveResponse
    const t = resultSummary({ builderType: "transition", options: to, status: "done", result: alt, stockedSku: "FLGTC6-200" })
    expect(t.text).toBe("1 spool · stocked adapter FLGTC6-200 · $319.39 in stock, ships in 1–2 business days")
  })
})

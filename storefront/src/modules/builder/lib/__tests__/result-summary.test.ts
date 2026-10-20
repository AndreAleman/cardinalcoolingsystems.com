import { describe, expect, it } from "vitest"
import { DEFAULT_CDU_KIT_OPTIONS, DEFAULT_ROW_MANIFOLD_OPTIONS, getBuilder, leadTimeOf, QUOTE_PROMISE, type Options } from "@lib/cpq/shared"
import type { PricingView } from "@lib/builder/pricing-view"
import { kitContents, resultSummary, summaryBom } from "../result-summary"

const instant = (total: number): PricingView => ({
  mode: "instant",
  badge: "Instant",
  reason: "",
  price: { kind: "price", perUnit: total / 4, total, currency: "usd", basis: "list", asOf: "Oct 20, 2026" },
  signInPrompt: true,
  leadTime: leadTimeOf("stock").label,
  error: false,
})
const quote: PricingView = {
  mode: "quote",
  badge: "Quote",
  reason: "",
  price: { kind: "quote", promise: QUOTE_PROMISE },
  signInPrompt: false,
  leadTime: leadTimeOf("custom").label,
  error: false,
}
const checking: PricingView = { ...quote, mode: "checking", price: { kind: "checking" }, leadTime: leadTimeOf("stock").label }

const kit = (over: Record<string, unknown>) => ({ ...DEFAULT_CDU_KIT_OPTIONS, ...over }) as unknown as Options

describe("kitContents", () => {
  it("sums the same noun across gasket and valve roles, in BOM order", () => {
    expect(
      kitContents([
        { role: "hose", qty_total: 8 },
        { role: "ferrule", qty_total: 24 },
        { role: "clamp", qty_total: 16 },
        { role: "gasket_epdm", qty_total: 16 },
        { role: "doc", qty_total: 1 },
      ]),
    ).toBe("8 hoses, 24 ferrules, 16 clamps, 16 gaskets")
    expect(kitContents([{ role: "valve_bv", qty_total: 1 }, { role: "adapter_fl150", qty_total: 2 }])).toBe("1 valve, 2 adapters")
  })
})

describe("resultSummary", () => {
  it("instant: count first, contents, the resolve's total and the stock lead time", () => {
    const o = kit({ run: "hose", units: 4 })
    const local = getBuilder("cdu-kit").bom(o)
    const s = resultSummary({ builderType: "cdu-kit", options: o, units: 4, bom: summaryBom(null, local), view: instant(1234) })
    expect(s.units).toBe("4 CDUs")
    expect(s.contents).toMatch(/^8 hoses, \d+ ferrules?, 16 clamps, 16 gaskets$/)
    expect(s.price).toEqual({ kind: "price", amount: "$1,234.00", rest: "in stock, ships in 1–2 business days" })
    expect(s.text).toBe(`4 CDUs · ${s.contents} · $1,234.00 in stock, ships in 1–2 business days`)
  })

  it("quote: the promise and lead time, never a price", () => {
    const o = kit({ run: "hard", units: 4 })
    const s = resultSummary({ builderType: "cdu-kit", options: o, units: 4, bom: summaryBom(null, getBuilder("cdu-kit").bom(o)), view: quote })
    expect(s.contents.startsWith("8 spools")).toBe(true)
    expect(s.price).toEqual({ kind: "quote", promise: QUOTE_PROMISE, lead: "custom production, 3–6 weeks" })
    expect(s.text).not.toMatch(/\$/)
  })

  it("loading: counts are known, the price is a skeleton (no number)", () => {
    const o = kit({ units: 1 })
    const s = resultSummary({ builderType: "cdu-kit", options: o, units: 1, bom: summaryBom(null, getBuilder("cdu-kit").bom(o)), view: checking })
    expect(s.units).toBe("1 CDU")
    expect(s.price).toEqual({ kind: "loading" })
    expect(s.text).not.toMatch(/\$|quote/i)
  })

  it("prefers the resolve's BOM quantities over the local BOM", () => {
    const bom = summaryBom({ bom: [{ role: "hose", qty_total: 6 }] as never }, { lines: [{ role: "hose", qty_per_unit: 2 }], units: 1 })
    expect(bom).toEqual([{ role: "hose", qty_total: 6 }])
  })

  it("manifold, transition, strainer and hose get a short description", () => {
    const m = resultSummary({ builderType: "row-manifold", options: DEFAULT_ROW_MANIFOLD_OPTIONS as unknown as Options, units: 2, bom: [], view: quote })
    expect(m.text).toMatch(/^2 manifolds · 12 × 1" drops at 24" on a 4" header · Firm quote/)
    const t = resultSummary({ builderType: "transition", options: { od: 200, odb: 200, len: 12 } as Options, units: 1, bom: [], view: instant(319.39), stockedSku: "FLGTC6-200" })
    expect(t.text).toBe("1 spool · stocked adapter FLGTC6-200 · $319.39 in stock, ships in 1–2 business days")
    const h = resultSummary({ builderType: "hose", options: { size: 150, len: 36 } as Options, units: 3, bom: [], view: checking })
    expect(h.text).toBe('3 hoses · 1.5" × 36"')
  })
})

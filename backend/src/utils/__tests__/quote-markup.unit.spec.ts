import { computeQuoteTotals, computeSellPrice } from "../../workflows/quote/utils/markup";

describe("computeSellPrice", () => {
  it("applies a whole-percent markup", () => {
    expect(computeSellPrice(100, 25)).toBe(125)
  })

  it("rounds half-up to whole cents", () => {
    // 10.05 * 1.33 = 13.3665 → 13.37
    expect(computeSellPrice(10.05, 33)).toBe(13.37)
  })

  it("survives the classic binary-float half-cent trap", () => {
    // 2.5 * 1.07 = 2.675, which floats as 2.67499999…; naive rounding
    // yields 2.67. Half-up says 2.68.
    expect(computeSellPrice(2.5, 7)).toBe(2.68)
  })

  it("returns 0 for zero-cost lines regardless of markup", () => {
    expect(computeSellPrice(0, 50)).toBe(0)
    expect(computeSellPrice(0, 0)).toBe(0)
  })

  it("passes cost through at zero markup", () => {
    expect(computeSellPrice(19.99, 0)).toBe(19.99)
  })

  it("supports fractional markup percentages", () => {
    expect(computeSellPrice(80, 12.5)).toBe(90)
  })

  it("rejects negative cost", () => {
    expect(() => computeSellPrice(-1, 10)).toThrow(/cost/i)
  })

  it("rejects negative markup — discounting below cost is not a markup", () => {
    expect(() => computeSellPrice(10, -5)).toThrow(/markup/i)
  })

  it("rejects non-finite inputs", () => {
    expect(() => computeSellPrice(NaN, 10)).toThrow()
    expect(() => computeSellPrice(10, Infinity)).toThrow()
  })
})

describe("computeQuoteTotals", () => {
  it("totals cost, sell, and margin across priced lines", () => {
    const totals = computeQuoteTotals([
      { quantity: 2, cost: 10, markup_pct: 50, sell_price: 15 },
      { quantity: 1, cost: 4, markup_pct: 25, sell_price: 5 },
    ])
    expect(totals).toEqual({
      total_cost: 24,
      total_sell: 35,
      margin: 11,
      margin_pct: 31.43,
      priced_lines: 2,
      unpriced_lines: 0,
    })
  })

  it("counts lines without cost data as unpriced — their sell still totals", () => {
    const totals = computeQuoteTotals([
      { quantity: 1, cost: 10, markup_pct: 20, sell_price: 12 },
      { quantity: 3, cost: null, markup_pct: null, sell_price: 8 },
    ])
    expect(totals).toEqual({
      total_cost: 10,
      total_sell: 36,
      margin: 26,
      margin_pct: 72.22,
      priced_lines: 1,
      unpriced_lines: 1,
    })
  })

  it("includes zero-cost priced lines in the cost total (0 is data)", () => {
    const totals = computeQuoteTotals([
      { quantity: 5, cost: 0, markup_pct: 0, sell_price: 9.5 },
    ])
    expect(totals.total_cost).toBe(0)
    expect(totals.priced_lines).toBe(1)
    expect(totals.unpriced_lines).toBe(0)
  })

  it("reports null margin_pct when total sell is zero — no divide-by-zero", () => {
    const totals = computeQuoteTotals([
      { quantity: 1, cost: 0, markup_pct: 0, sell_price: 0 },
    ])
    expect(totals.margin_pct).toBeNull()
    expect(totals.margin).toBe(0)
  })

  it("returns zeroed totals for an empty quote", () => {
    expect(computeQuoteTotals([])).toEqual({
      total_cost: 0,
      total_sell: 0,
      margin: 0,
      margin_pct: null,
      priced_lines: 0,
      unpriced_lines: 0,
    })
  })

  it("keeps money totals on whole cents (no float drift)", () => {
    const totals = computeQuoteTotals([
      { quantity: 3, cost: 0.1, markup_pct: 0, sell_price: 0.1 },
      { quantity: 3, cost: 0.2, markup_pct: 0, sell_price: 0.2 },
    ])
    // 3×0.1 + 3×0.2 floats to 0.9000000000000001 without cent rounding
    expect(totals.total_cost).toBe(0.9)
    expect(totals.total_sell).toBe(0.9)
  })
})

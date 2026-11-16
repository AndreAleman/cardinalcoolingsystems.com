import { describe, expect, it } from "vitest"
import { buildCatalogCut } from "../catalog-cut"

describe("catalog cut", () => {
  it("keeps only 1\"–4\" families (2\"–4\" valves), dedupes, keeps posted prices", () => {
    const groups = buildCatalogCut([
      {
        handle: "long-clamp-ferrule",
        title: "Long Weld Clamp Ferrule",
        variants: [
          { sku: "14AM76-150", calculated_price: { calculated_amount: 4.2, currency_code: "usd" } },
          { sku: "14AM76-600", calculated_price: { calculated_amount: 40 } },
          { sku: "14AM76-150", calculated_price: { calculated_amount: 4.2 } },
        ],
      },
      { handle: "valve", title: "Ball valve", variants: [{ sku: "TCBVS-150" }, { sku: "TCBVS-200", calculated_price: { calculated_amount: "0" } }] },
      { handle: "x", title: "Unrelated", variants: [{ sku: "ZZZ-100" }] },
    ])
    expect(groups.map((g) => g.key)).toEqual(["ferrule", "ball-valve"])
    expect(groups[0].rows).toEqual([
      { sku: "14AM76-150", title: "Long Weld Clamp Ferrule", variantTitle: null, handle: "long-clamp-ferrule", price: 4.2, currency: "usd" },
    ])
    expect(groups[1].rows.map((r) => [r.sku, r.price])).toEqual([["TCBVS-200", null]])
  })
})

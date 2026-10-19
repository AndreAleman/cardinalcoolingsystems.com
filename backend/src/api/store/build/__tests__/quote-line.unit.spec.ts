import { getBuilder } from "../../../../lib/cpq-shared"
import { BUILDER_QUOTE_CART_MESSAGE, builderLineDetails, isBuilderQuoteLine } from "../../../../utils/builder-quote-line"
import { TtlCache, resolveCacheKey } from "../lib/cache"
import { decidePriceBasis, emailDomain } from "../lib/price-basis"
import {
  configurationIdFor,
  instantLineMetadata,
  planInstantLines,
  quoteLineItem,
  withUnits,
} from "../lib/quote-line"
import { resolveConfiguration, type ResolveResult } from "../lib/resolver"
import { fixtureCatalog } from "./fixture-catalog"

const catalog = fixtureCatalog()
function resolve(builder_type: any, raw: Record<string, unknown>): ResolveResult {
  const { options, ignored } = getBuilder(builder_type).decode(raw as any)
  return resolveConfiguration({ builder_type, options, ignored, catalog, price_basis: "list", priced_at: "2026-10-18" })
}

describe("quote line metadata (B3)", () => {
  it("one custom $0 line, title = describe, part number on the line, server-built metadata", () => {
    const r = resolve("transition", { a: "tc", b: "grv", od: 200, len: 12, qty: 2 })
    expect(r.pricing_mode).toBe("quote")
    const id = configurationIdFor(r.config_key)
    const item = quoteLineItem(r, id, "/us/build/transition")
    expect(item).toMatchObject({
      title: r.description,
      subtitle: `Part Number ${r.part_number}`,
      product_title: "Transition Spool",
      variant_sku: r.part_number,
      quantity: 2,
      unit_price: 0,
    })
    expect(item.metadata).toMatchObject({
      builder: true,
      builder_type: "transition",
      configuration: r.options,
      part_number: r.part_number,
      pricing_mode: "quote",
      lead_time: { kind: "custom" },
      configuration_id: id,
      config_key: r.config_key,
      source_page: "/us/build/transition",
    })
    expect(item.metadata.configuration_display[0]).toEqual({ label: "Part Number", value: r.part_number })
    expect(item.metadata.configuration_display).toContainEqual({ label: "End B", value: expect.any(String) })
    expect(isBuilderQuoteLine({ metadata: item.metadata as any })).toBe(true)
    expect(builderLineDetails({ metadata: item.metadata as any })[0]).toBe(`Part Number: ${r.part_number}`)
  })

  it("configuration_id is derived from config_key (same configuration → same id)", () => {
    const a = configurationIdFor("transition?v=1&a=tc")
    expect(a).toMatch(/^bcfg_[0-9A-F]{26}$/)
    expect(configurationIdFor("transition?v=1&a=tc")).toBe(a)
    expect(configurationIdFor("transition?v=1&a=bw")).not.toBe(a)
  })

  it("instant lines carry pricing_mode instant (never treated as a quote line)", () => {
    const r = resolve("transition", { a: "tc", b: "fl150", od: 200 })
    const md = instantLineMetadata(r, "bcfg_X", null)
    expect(md).toMatchObject({ builder: true, pricing_mode: "instant", part_number: r.part_number })
    expect(isBuilderQuoteLine({ metadata: md })).toBe(false)
  })
})

describe("units", () => {
  it("maps body units onto the builder's quantity key", () => {
    expect(withUnits("cdu-kit", { cdu: "boyd-10u" }, 4).options).toEqual({ cdu: "boyd-10u", units: 4 })
    expect(withUnits("transition", {}, 3).options).toEqual({ qty: 3 })
    expect(withUnits("row-manifold", { drops: 6 }, 3)).toEqual({ options: { drops: 6 }, unitsIgnored: true })
    expect(withUnits("hose", { qty: 2 }, undefined)).toEqual({ options: { qty: 2 }, unitsIgnored: false })
  })
})

describe("planInstantLines (ADR-0001 over-stock)", () => {
  const r = resolve("transition", { a: "tc", b: "fl150", od: 200, qty: 10 })
  it("adds the resolved variants", () => {
    expect(planInstantLines(r.bom, new Map())).toEqual([
      { variant_id: "variant_FLGTC6-200", sku: "FLGTC6-200", quantity: 10, over_stock: false, title: r.bom[0].label },
    ])
  })
  it("a line over stock once the cart quantity is counted is still added, as quote-only", () => {
    const [p] = planInstantLines(r.bom, new Map([["variant_FLGTC6-200", 5]]))
    expect(p).toMatchObject({ quantity: 10, over_stock: true })
  })
  it("sums two roles that resolve to the same variant", () => {
    const bom = [r.bom[0], { ...r.bom[0], role: "other", qty_total: 1 }]
    expect(planInstantLines(bom, new Map())[0].quantity).toBe(11)
  })
})

describe("checkout guard (B3)", () => {
  it("a builder Quote line blocks; anything else does not", () => {
    expect(isBuilderQuoteLine({ metadata: { builder: true, pricing_mode: "quote" } })).toBe(true)
    expect(isBuilderQuoteLine({ metadata: { builder: true, pricing_mode: "instant" } })).toBe(false)
    expect(isBuilderQuoteLine({ metadata: { pricing_mode: "quote" } })).toBe(false)
    expect(isBuilderQuoteLine({ metadata: { builder: "true", pricing_mode: "quote" } })).toBe(false)
    expect(isBuilderQuoteLine({ metadata: null })).toBe(false)
    expect(isBuilderQuoteLine(null)).toBe(false)
    expect(BUILDER_QUOTE_CART_MESSAGE).toMatch(/request a quote/i)
  })
  it("details only for builder lines", () => {
    expect(builderLineDetails({ metadata: { sku: "x" } })).toEqual([])
    expect(builderLineDetails({ metadata: { builder: true, configuration_display: [{ label: "A", value: "B" }, { bad: 1 }] } })).toEqual(["A: B"])
  })
})

describe("price basis (B2)", () => {
  it("company only for an Approved Company with a Customer Group", () => {
    expect(decidePriceBasis({ status: "approved", customer_group_id: "cusgroup_1" })).toEqual({ price_basis: "company", customer_group_id: "cusgroup_1" })
    expect(decidePriceBasis({ status: "pending", customer_group_id: "cusgroup_1" }).price_basis).toBe("list")
    expect(decidePriceBasis({ status: "declined", customer_group_id: "cusgroup_1" }).price_basis).toBe("list")
    expect(decidePriceBasis({ status: "approved", customer_group_id: null }).price_basis).toBe("list")
    expect(decidePriceBasis(null)).toEqual({ price_basis: "list", customer_group_id: null })
  })
  it("email domain", () => {
    expect(emailDomain("Ada@Boyd.COM")).toBe("boyd.com")
    expect(emailDomain("nope")).toBeNull()
    expect(emailDomain(null)).toBeNull()
  })
})

describe("resolve cache", () => {
  it("expires after the TTL and keys on basis + group", () => {
    let now = 0
    const c = new TtlCache<number>(60_000, 10, () => now)
    c.set("k", 1)
    now = 59_999
    expect(c.get("k")).toBe(1)
    now = 60_000
    expect(c.get("k")).toBeUndefined()
    expect(resolveCacheKey("cdu-kit?v=1", "company", "g1")).not.toBe(resolveCacheKey("cdu-kit?v=1", "list", null))
  })
  it("evicts the oldest entry past max", () => {
    const c = new TtlCache<number>(60_000, 2)
    c.set("a", 1)
    c.set("b", 2)
    c.set("c", 3)
    expect(c.get("a")).toBeUndefined()
    expect(c.get("c")).toBe(3)
  })
})

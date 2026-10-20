import { candidatesFor, formatLb, getBuilder, line, roundLb, totalLb, type BomLine } from "../../../../lib/cpq-shared"
import {
  checkCandidate,
  instantTotals,
  isoDate,
  resolveConfiguration,
  resolveLine,
  selectCandidate,
  type ResolveResult,
} from "../lib/resolver"
import { fixtureCatalog } from "./fixture-catalog"

const catalog = fixtureCatalog()
const PRICED_AT = "2026-10-18"

function resolve(builder_type: any, raw: Record<string, unknown>, cat = catalog): ResolveResult {
  const { options, ignored } = getBuilder(builder_type).decode(raw as any)
  return resolveConfiguration({ builder_type, options, ignored, catalog: cat, price_basis: "list", priced_at: PRICED_AT })
}

const skuLine = (candidates: string[], qty = 1): BomLine => ({
  role: "test",
  label: "Test part",
  candidates,
  qty_per_unit: qty,
  kind: "sku",
  lead_time: "stock",
})

describe("candidate selection (B1: first candidate that RESOLVES)", () => {
  it("takes the preferred candidate when it resolves", () => {
    const l = line({ role: "ferrule", label: "Ferrule", qty: 1, vars: { d: "6", s: 150 } })
    expect(l.candidates).toEqual(["14AM76-150", "14WMP6-150"])
    const sel = selectCandidate(l, 2, catalog)
    expect(sel).toMatchObject({ resolved: true, reason: null })
    expect(sel.variant?.sku).toBe("14AM76-150")
  })

  it("falls through a stock-0 first choice to the stocked next one (14AM76-600 → 14WMP6-600)", () => {
    const l = line({ role: "ferrule", label: "Ferrule", qty: 1, vars: { d: "6", s: 600 } })
    expect(candidatesFor("ferrule", { d: "6", s: 600 })).toEqual(["14AM76-600", "14WMP6-600"])
    const sel = selectCandidate(l, 4, catalog)
    expect(sel.resolved).toBe(true)
    expect(sel.variant?.sku).toBe("14WMP6-600")
  })

  it("falls through when the first choice has stock but not enough for the total", () => {
    const sel = selectCandidate(skuLine(["14AM76-150", "14WMP6-150"]), 430, catalog)
    expect(sel.variant?.sku).toBe("14WMP6-150")
    expect(selectCandidate(skuLine(["14AM76-150", "14WMP6-150"]), 500, catalog)).toMatchObject({
      resolved: false,
      reason: "14AM76-150: 425 in stock, 500 needed",
    })
  })

  it("never resolves a variant with weight 0 (22MP6-150)", () => {
    const sel = selectCandidate(skuLine(["22MP6-150"]), 1, catalog)
    expect(sel).toMatchObject({ resolved: false, reason: "22MP6-150 has no weight on file" })
    expect(sel.variant?.sku).toBe("22MP6-150")
  })

  it("never resolves a $0 variant (19MPX6-050)", () => {
    expect(selectCandidate(skuLine(["19MPX6-050"]), 1, catalog)).toMatchObject({
      resolved: false,
      reason: "19MPX6-050 has no price",
    })
  })

  it("skips a weight-0 / $0 first candidate for a good second one", () => {
    const sel = selectCandidate(skuLine(["22MP6-150", "19MPX6-050", "22MP4-150"]), 3, catalog)
    expect(sel.variant?.sku).toBe("22MP4-150")
    expect(sel.resolved).toBe(true)
  })

  it("reports the best EXISTING candidate when none resolves", () => {
    const sel = selectCandidate(skuLine(["NOPE-1", "TCBVS-150", "22MP6-150"]), 2, catalog)
    expect(sel.resolved).toBe(false)
    expect(sel.variant?.sku).toBe("TCBVS-150")
    expect(sel.reason).toBe("TCBVS-150: 0 in stock, 2 needed")
  })

  it("an unpublished variant does not resolve", () => {
    const cat = fixtureCatalog({ "14AM76-150": { published: false } })
    expect(selectCandidate(skuLine(["14AM76-150", "14WMP6-150"]), 1, cat).variant?.sku).toBe("14WMP6-150")
    expect(checkCandidate(cat.get("14AM76-150")!, 1)).toEqual({ ok: false, reason: "14AM76-150 is not published" })
  })

  it("manage_inventory off resolves with any stock", () => {
    const cat = fixtureCatalog({ "TCBVS-150": { manage_inventory: false, stock_qty: null } })
    expect(selectCandidate(skuLine(["TCBVS-150"]), 50, cat).resolved).toBe(true)
  })

  it("no candidate in the store, or no candidates at all → not stocked", () => {
    expect(selectCandidate(skuLine(["NOPE-1"]), 1, catalog)).toEqual({
      variant: null,
      resolved: false,
      reason: "Not stocked: Test part",
    })
    expect(selectCandidate(skuLine([]), 1, catalog).reason).toBe("Not stocked: Test part")
  })

  it("a fabricated line is always Quote", () => {
    const l: BomLine = { ...skuLine(["14AM76-150"]), kind: "fabricated", label: "Spool" }
    expect(selectCandidate(l, 1, catalog)).toEqual({ variant: null, resolved: false, reason: "Made to order: Spool" })
  })
})

describe("pricing mode and quote_reasons", () => {
  it("Boyd 10U hard-pipe kit: Quote (welded spool), stocked lines still resolve", () => {
    const r = resolve("cdu-kit", { cdu: "boyd-10u", run: "hard" })
    expect(r.options).toMatchObject({ cdu: "boyd-10u", port: "tc150", run: "hard", far: "tc" })
    expect(r.pricing_mode).toBe("quote")
    expect(r.price_per_unit).toBeNull()
    expect(r.price_total).toBeNull()
    expect(r.quote_reasons).toEqual([expect.stringMatching(/^Made to order: Spool, 1-1\/2" TC × TC/)])
    const bySku = Object.fromEntries(r.bom.filter((l) => l.sku).map((l) => [l.role, l]))
    expect(bySku.ferrule).toMatchObject({ sku: "14AM76-150", resolved: true, unit_price: 5.38, qty_per_unit: 6 })
    expect(bySku.clamp).toMatchObject({ sku: "13MHHM-100-150", resolved: true })
    expect(bySku.gasket_epdm).toMatchObject({ sku: "GTCE-150", resolved: true })
    expect(r.lead_time.kind).toBe("custom")
    expect(r.quote_promise).toMatch(/1 business day/)
    expect(r.part_number).toMatch(/^kit-cdu-[0-9a-f]{8}$/)
    expect(r.price_basis).toBe("list")
    expect(r.priced_at).toBe(PRICED_AT)
    expect(r.currency_code).toBe("usd")
  })

  it("Boyd 10U with ball valves: the stock-0 TCBVS-150 is a reason too", () => {
    const r = resolve("cdu-kit", { cdu: "boyd-10u", iso: "bv" })
    expect(r.quote_reasons).toContain("TCBVS-150: 0 in stock, 2 needed")
    expect(r.bom.find((l) => l.role === "valve_bv")).toMatchObject({ sku: "TCBVS-150", resolved: false, in_stock: false, stock_qty: 0 })
  })

  it("hose run (the default since 2026-10-20): no stocked hose → Quote with a not-stocked reason", () => {
    for (const raw of [{ cdu: "boyd-10u", run: "hose" }, { cdu: "boyd-10u" }]) {
      const r = resolve("cdu-kit", raw)
      expect(r.options).toMatchObject({ run: "hose", far: "tc" })
      expect(r.pricing_mode).toBe("quote")
      expect(r.quote_reasons).toEqual([expect.stringMatching(/^Not stocked: Stainless braided hose assembly/)])
      // Hose ends come with the hose: only the facility-end ferrule per port.
      expect(r.bom.find((l) => l.role === "ferrule")).toMatchObject({ sku: "14AM76-150", qty_per_unit: 2, resolved: true })
    }
  })

  it("row manifold is always Quote", () => {
    const r = resolve("row-manifold", {})
    expect(r.pricing_mode).toBe("quote")
    expect(r.quote_reasons.length).toBeGreaterThan(0)
  })

  it("reports ignored keys from the forgiving decode", () => {
    const r = resolve("cdu-kit", { port: "tc999", units: 4 })
    expect(r.ignored).toContain("port")
    expect(r.units).toBe(4)
  })
})

describe("Instant totals × units", () => {
  it("price_per_unit = Σ unit_price × qty_per_unit, price_total = × units", () => {
    expect(
      instantTotals(
        [
          { resolved: true, unit_price: 5.38, qty_per_unit: 6 },
          { resolved: true, unit_price: 0.65, qty_per_unit: 4 },
        ],
        4
      )
    ).toEqual({ price_per_unit: 34.88, price_total: 139.52 })
  })

  it("no totals when any line is unresolved (never a partial price)", () => {
    expect(instantTotals([{ resolved: true, unit_price: 5, qty_per_unit: 1 }, { resolved: false, unit_price: null, qty_per_unit: 1 }], 1)).toBeNull()
    expect(instantTotals([], 1)).toBeNull()
  })

  it("line_total and qty_total scale with units", () => {
    const l = line({ role: "ferrule", label: "Ferrule", qty: 6, vars: { d: "6", s: 150 } })
    expect(resolveLine(l, 4, catalog)).toMatchObject({ qty_total: 24, unit_price: 5.38, line_total: 129.12, in_stock: true })
  })
})

describe("transition stocked alternative", () => {
  it("TC × 150# flange at 2\": the stocked FLGTC6-200 prices Instant", () => {
    const r = resolve("transition", { a: "tc", b: "fl150", od: 200, len: 12, qty: 3 })
    expect(r.pricing_mode).toBe("instant")
    expect(r.bom).toHaveLength(1)
    expect(r.bom[0]).toMatchObject({ sku: "FLGTC6-200", qty_total: 3, resolved: true })
    expect(r.stocked_alternative).toEqual({ sku: "FLGTC6-200", variant_id: "variant_FLGTC6-200", unit_price: 319.39 })
    expect(r.price_per_unit).toBe(319.39)
    expect(r.price_total).toBe(958.17)
    expect(r.lead_time.kind).toBe("stock")
    expect(r.quote_promise).toBeNull()
    expect(r.part_number).toBe("clmp-fl150-tspool-l12-6-200")
  })

  it("more than the adapter's stock → custom transition (Quote), no alternative", () => {
    const r = resolve("transition", { a: "tc", b: "fl150", od: 200, qty: 13 })
    expect(r.pricing_mode).toBe("quote")
    expect(r.stocked_alternative).toBeNull()
  })

  it("butt-weld pipe adapter 19MPX6-200 has 0 stock → Quote", () => {
    const r = resolve("transition", { a: "tc", b: "bwp", od: 200 })
    expect(r.pricing_mode).toBe("quote")
    expect(r.stocked_alternative).toBeNull()
  })

  it("no alternative when end A is not tri-clamp", () => {
    const r = resolve("transition", { a: "bw", b: "fl150", od: 200 })
    expect(r.pricing_mode).toBe("quote")
    expect(r.stocked_alternative).toBeNull()
  })
})

describe("weight: rounded once to 0.1 lb; the total is the rounded weight × units", () => {
  it("a manifold pair weighs exactly 2 × one manifold, as the drawing's title block shows it", () => {
    for (const raw of [{}, { header: 600, drops: 24, dstyle: "bv" }, { drops: 7, pitch: 13, pair: "1" }, { header: 300, drop: 150, drops: 31 }]) {
      const r = resolve("row-manifold", raw)
      const exact = getBuilder("row-manifold").weight(r.options as any).per_unit_lb
      expect(r.weight_lb_per_unit).toBe(roundLb(exact))
      expect(Number.isInteger(Math.round(r.weight_lb_per_unit * 10))).toBe(true)
      expect(r.weight_lb_per_unit * 10).toBeCloseTo(Math.round(r.weight_lb_per_unit * 10), 9)
      expect(r.units).toBe(2)
      expect(r.weight_lb_total).toBe(totalLb(exact, 2))
      expect(formatLb(r.weight_lb_total)).toBe(formatLb(2 * r.weight_lb_per_unit))
      expect(r.weight_lb_total * 10).toBeCloseTo(2 * r.weight_lb_per_unit * 10, 9)
    }
    // The default 4" manifold: per-manifold and pair both to one decimal.
    const d = resolve("row-manifold", {})
    expect(`≈ ${formatLb(d.weight_lb_per_unit)} lb each · ${formatLb(d.weight_lb_total)} lb for the pair`).toMatch(
      /^≈ \d+\.\d lb each · \d+\.\d lb for the pair$/
    )
  })

  it("units multiply the rounded weight for every builder", () => {
    const k = resolve("cdu-kit", { units: 7 })
    expect(k.weight_lb_total).toBe(totalLb(k.weight_lb_per_unit, 7))
    const alt = resolve("transition", { a: "tc", b: "fl150", od: 200, qty: 3 })
    expect(alt.weight_lb_total).toBe(totalLb(alt.weight_lb_per_unit, 3))
  })
})

describe("priced_at", () => {
  it("is the Miami business date, not UTC", () => {
    expect(isoDate(new Date("2026-10-19T01:30:00Z"))).toBe("2026-10-18")
    expect(isoDate(new Date("2026-10-19T12:00:00Z"))).toBe("2026-10-19")
  })
})

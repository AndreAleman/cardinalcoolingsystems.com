import { describe, expect, it } from "vitest"
import { getBuilder, leadTimeOf } from "@lib/cpq/shared"
import { listLeadTime, localBomRows, resolvedBomRows } from "../bom-view"
import type { ResolvedBomLine } from "../types"

describe("BOM rows", () => {
  it("local rows: fabricated lines are made to order, stocked roles are 'checking'", () => {
    const o = { ...getBuilder("cdu-kit").defaults, run: "hard", units: 2 }
    const bom = getBuilder("cdu-kit").bom(o)
    const rows = localBomRows(bom)
    const spool = rows.find((r) => r.role === "spool")!
    expect(spool.stock).toBe("made_to_order")
    expect(spool.qtyTotal).toBe(spool.qtyPerUnit * 2)
    expect(rows.find((r) => r.role === "clamp")!.stock).toBe("checking")
    expect(listLeadTime(rows)).toBe(leadTimeOf("custom").label)
  })

  it("resolved rows: in stock, short, not stocked; lead time per line", () => {
    const line = (over: Partial<ResolvedBomLine>): ResolvedBomLine => ({
      role: "clamp", label: "Clamp", sku: "13MHHM-150", variant_id: "v", qty_per_unit: 4, qty_total: 8,
      unit_price: 6.79, line_total: 54.32, in_stock: true, stock_qty: 100, weight_lb: 1, lead_time: "stock", resolved: true,
      ...over,
    })
    const rows = resolvedBomRows([
      line({}),
      line({ role: "valve_bv", sku: "TCBVS-150", in_stock: false, stock_qty: 0, resolved: false, lead_time: "custom", unit_price: 120 }),
      line({ role: "strainer", sku: null, variant_id: null, unit_price: null, line_total: null, in_stock: null, resolved: false, lead_time: "custom" }),
    ])
    // Without the local BOM, a custom line with no SKU reads as made to order.
    expect(rows.map((r) => r.stock)).toEqual(["in_stock", "short", "made_to_order"])
    expect(rows[0].leadTime).toBe(leadTimeOf("stock").label)
    expect(rows[1].leadTime).toBe(leadTimeOf("custom").label)
    expect(rows[1].note).toMatch(/0 on hand/)
    expect(rows[2].unitPrice).toBeNull()
    expect(listLeadTime(rows.slice(0, 1))).toBe(leadTimeOf("stock").label)
    expect(listLeadTime(rows)).toBe(leadTimeOf("custom").label)
  })

  it("resolved rows use the local BOM to tell fabricated from not-stocked", () => {
    const o = { ...getBuilder("cdu-kit").defaults, run: "hard" }
    const bom = getBuilder("cdu-kit").bom(o)
    const lines: ResolvedBomLine[] = bom.lines.map((l) => ({
      role: l.role, label: l.label, sku: null, variant_id: null, qty_per_unit: l.qty_per_unit, qty_total: l.qty_per_unit,
      unit_price: null, line_total: null, in_stock: null, stock_qty: null, weight_lb: null, lead_time: "custom", resolved: false,
    }))
    const rows = resolvedBomRows(lines, bom)
    expect(rows.find((r) => r.role === "spool")!.stock).toBe("made_to_order")
    expect(rows.find((r) => r.role === "clamp")!.stock).toBe("not_stocked")
  })
})

describe("resolver fields (commerce backend)", () => {
  it("uses kind and reason; keeps stocked line prices in a Quote configuration", () => {
    const rows = resolvedBomRows([
      {
        role: "clamp", label: "Clamp", sku: "13MHHM-150", variant_id: "v", qty_per_unit: 4, qty_total: 4, unit_price: 6.79,
        line_total: 27.16, in_stock: true, stock_qty: 50, weight_lb: 1, lead_time: "stock", resolved: true, kind: "sku", reason: null,
      },
      {
        role: "spool", label: "Spool", sku: null, variant_id: null, qty_per_unit: 2, qty_total: 2, unit_price: null, line_total: null,
        in_stock: null, stock_qty: null, weight_lb: null, lead_time: "custom", resolved: false, kind: "fabricated",
        reason: "Welded spool", part_number: "clmp-clmp-spool-l36-6-150",
      },
    ])
    expect(rows[0]).toMatchObject({ stock: "in_stock", unitPrice: 6.79, lineTotal: 27.16 })
    expect(rows[1]).toMatchObject({ stock: "made_to_order", note: "Welded spool", sku: "clmp-clmp-spool-l36-6-150" })
  })
})

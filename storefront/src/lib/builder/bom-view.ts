// BOM rows for the table: the resolver's rows once known, otherwise the local BOM (same lines,
// no price, stock "checking"). Pure; unit-tested in __tests__/bom-view.test.ts.

import { leadTimeOf, type Bom } from "@lib/cpq/shared"
import type { ResolvedBomLine } from "./types"

export type BomRow = {
  role: string
  label: string
  sku: string | null
  qtyPerUnit: number
  qtyTotal: number
  unitPrice: number | null
  lineTotal: number | null
  stock: "in_stock" | "short" | "made_to_order" | "not_stocked" | "checking"
  stockLabel: string
  leadTime: string
  /** Shown under an unresolved line. */
  note: string | null
}

const STOCK_LABEL: Record<BomRow["stock"], string> = {
  in_stock: "In stock",
  short: "Short: quoted",
  made_to_order: "Made to order",
  not_stocked: "Not stocked yet",
  checking: "Checking…",
}

function stockOf(l: ResolvedBomLine, fabricated: boolean): BomRow["stock"] {
  if (l.resolved && l.in_stock !== false) return "in_stock"
  if (l.sku && l.in_stock === false) return "short"
  return fabricated ? "made_to_order" : "not_stocked"
}

function noteOf(l: ResolvedBomLine, stock: BomRow["stock"]): string | null {
  if (l.resolved && stock === "in_stock") return l.note || null
  if (l.reason && l.reason.trim()) return l.reason.trim()
  if (stock === "short") {
    return typeof l.stock_qty === "number" ? `${l.stock_qty} on hand; the rest is quoted.` : "Not enough on hand; quoted."
  }
  if (stock === "not_stocked") return "We don't stock this part yet: priced in your quote."
  if (stock === "made_to_order") return "Welded or cut to length: priced in your quote."
  return null
}

/**
 * `local` is the shared BOM of the same options (the resolver builds its lines from it, in order):
 * it tells a fabricated line (made to order) from a part we don't stock yet.
 */
export function resolvedBomRows(lines: readonly ResolvedBomLine[], local?: Bom | null): BomRow[] {
  return lines.map((l, i) => {
    const twin = local?.lines[i]?.role === l.role ? local.lines[i] : local?.lines.find((x) => x.role === l.role)
    const fabricated = l.kind ? l.kind === "fabricated" : twin ? twin.kind === "fabricated" : l.lead_time === "custom" && !l.sku
    const stock = stockOf(l, fabricated)
    return {
      role: l.role,
      label: l.label,
      sku: l.sku ?? l.part_number ?? null,
      qtyPerUnit: l.qty_per_unit,
      qtyTotal: l.qty_total,
      unitPrice: typeof l.unit_price === "number" && l.unit_price > 0 ? l.unit_price : null,
      lineTotal: typeof l.line_total === "number" && l.line_total > 0 ? l.line_total : null,
      stock,
      stockLabel: STOCK_LABEL[stock],
      leadTime: leadTimeOf(l.lead_time === "stock" && stock === "in_stock" ? "stock" : "custom").label,
      note: noteOf(l, stock),
    }
  })
}

export function localBomRows(bom: Bom): BomRow[] {
  return bom.lines.map((l) => {
    const fabricated = l.kind === "fabricated"
    const never = !fabricated && l.candidates.length === 0
    const stock: BomRow["stock"] = fabricated ? "made_to_order" : never ? "not_stocked" : "checking"
    return {
      role: l.role,
      label: l.label,
      sku: l.part_number ?? null,
      qtyPerUnit: l.qty_per_unit,
      qtyTotal: l.qty_per_unit * bom.units,
      unitPrice: null,
      lineTotal: null,
      stock,
      stockLabel: STOCK_LABEL[stock],
      leadTime: leadTimeOf(l.lead_time).label,
      note: l.note ?? null,
    }
  })
}

/** The whole list's lead time: the slowest line. */
export function listLeadTime(rows: readonly BomRow[]): string {
  const custom = rows.some((r) => r.stock !== "in_stock" && r.stock !== "checking")
  return leadTimeOf(custom ? "custom" : "stock").label
}

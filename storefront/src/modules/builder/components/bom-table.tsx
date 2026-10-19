"use client"

// BOM table: one row per part, quantity per unit and in total, unit price, line total, a stock
// badge, the line's lead time and a note under any line that isn't Instant.

import { listLeadTime, type BomRow } from "@lib/builder/bom-view"
import { convertToLocale } from "@lib/util/money"
import { clx } from "@medusajs/ui"

const STOCK_CLS: Record<BomRow["stock"], string> = {
  in_stock: "bg-emerald-50 text-emerald-800 border-emerald-200",
  short: "bg-amber-50 text-amber-900 border-amber-200",
  made_to_order: "bg-neutral-100 text-neutral-800 border-neutral-200",
  not_stocked: "bg-neutral-100 text-neutral-800 border-neutral-200",
  checking: "bg-white text-neutral-500 border-neutral-200",
}

export default function BomTable({
  rows,
  unitNoun,
  currency,
  total,
}: {
  rows: BomRow[]
  unitNoun: string
  currency: string
  /** Instant list total, shown in the footer; null for Quote. */
  total: number | null
}) {
  const money = (n: number | null) => (n === null ? "—" : convertToLocale({ amount: n, currency_code: currency }))
  return (
    <section aria-label="Bill of materials" className="border border-neutral-200 bg-white" data-testid="bom-table">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">Bill of materials</h2>
        <p className="text-xs text-neutral-500" data-testid="bom-lead-time">
          Whole list: {listLeadTime(rows)}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Part
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Per {unitNoun}
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Total qty
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Unit price
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Line total
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Stock / lead time
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.role}-${i}`} className="border-t border-neutral-100 align-top" data-testid="bom-row" data-stock={r.stock}>
                <td className="px-4 py-3">
                  <p className="text-neutral-900">{r.label}</p>
                  {r.sku ? <p className="font-mono text-xs text-neutral-500">{r.sku}</p> : null}
                  {r.note ? (
                    <p className="mt-1 text-xs text-neutral-500" data-testid="bom-note">
                      {r.note}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{r.qtyPerUnit}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.qtyTotal}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.unitPrice === null ? (r.stock === "checking" ? "…" : "Quote") : money(r.unitPrice)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.lineTotal === null ? (r.stock === "checking" ? "…" : "Quote") : money(r.lineTotal)}</td>
                <td className="px-4 py-3">
                  <span className={clx("inline-block border px-2 py-0.5 text-xs font-medium", STOCK_CLS[r.stock])}>{r.stockLabel}</span>
                  <p className="mt-1 text-xs text-neutral-500">{r.leadTime}</p>
                </td>
              </tr>
            ))}
          </tbody>
          {total !== null ? (
            <tfoot>
              <tr className="border-t border-neutral-200 bg-neutral-50">
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-neutral-900">
                  Total
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-neutral-900" data-testid="bom-total">
                  {money(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  )
}

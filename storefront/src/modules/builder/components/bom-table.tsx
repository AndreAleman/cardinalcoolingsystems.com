"use client"

// BOM table: one row per part, quantity per unit and in total, unit price, line total, a stock
// badge, the line's lead time and a note under any line that isn't Instant. The page's one BOM: a
// single table at every width. Phones (< xsmall) keep Part, Qty and Line total as columns and fold
// the per-unit quantity, unit price and stock under the part name, so nothing scrolls sideways.

import { listLeadTime, type BomRow } from "@lib/builder/bom-view"
import { SIGN_IN_PROMPT } from "@lib/builder/pricing-view"
import type { PriceBasis } from "@lib/builder/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
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
  basis = null,
  asOf = "",
}: {
  rows: BomRow[]
  unitNoun: string
  currency: string
  /** Instant list total, shown in the footer; null for Quote. */
  total: number | null
  /** B2: whose prices the rows show (null until the resolve answers) and their as-of date. */
  basis?: PriceBasis | null
  asOf?: string
}) {
  const money = (n: number | null) => (n === null ? "—" : convertToLocale({ amount: n, currency_code: currency }))
  const price = (n: number | null, r: BomRow) => (n === null ? (r.stock === "checking" ? "…" : "Quote") : money(n))
  // A Quote configuration (every kit with a spool or hose today) still shows its stocked lines'
  // posted prices, so they carry their basis and as-of date here too (B2). The sign-in prompt is
  // only repeated here when there is no price block above (Quote).
  const priced = basis !== null && rows.some((r) => r.unitPrice !== null)
  return (
    <section aria-label="Bill of materials" className="border border-neutral-200 bg-white" data-testid="bom-table">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">Bill of materials</h2>
        <p className="text-xs text-neutral-500" data-testid="bom-lead-time">
          Whole list: {listLeadTime(rows)}
        </p>
        {priced ? (
          <p className="w-full text-xs text-neutral-500" data-testid="bom-price-basis" data-basis={basis}>
            {basis === "company" ? "Your company prices" : "List prices"}
            {asOf ? `, as of ${asOf}` : ""}
            {basis !== "company" && total === null ? (
              <>
                {" · "}
                <LocalizedClientLink href="/account" className="font-medium text-cardinal-red underline">
                  {SIGN_IN_PROMPT}
                </LocalizedClientLink>
              </>
            ) : null}
          </p>
        ) : null}
      </header>
      <div className="xsmall:overflow-x-auto">
        <table className="w-full text-left text-sm xsmall:min-w-[600px]">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Part
              </th>
              <th scope="col" className="hidden px-3 py-2 text-right font-medium xsmall:table-cell">
                Per {unitNoun}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium xsmall:px-3">
                <span className="xsmall:hidden">Qty</span>
                <span className="hidden xsmall:inline">Total qty</span>
              </th>
              <th scope="col" className="hidden px-3 py-2 text-right font-medium xsmall:table-cell">
                Unit price
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                <span className="xsmall:hidden">Total</span>
                <span className="hidden xsmall:inline">Line total</span>
              </th>
              <th scope="col" className="hidden px-4 py-2 font-medium xsmall:table-cell">
                Stock / lead time
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.role}-${i}`} className="border-t border-neutral-100 align-top" data-testid="bom-row" data-stock={r.stock}>
                <td className="px-3 py-3 xsmall:px-4">
                  <p className="text-neutral-900">{r.label}</p>
                  {r.sku ? <p className="break-all font-mono text-xs text-neutral-500">{r.sku}</p> : null}
                  {r.note ? (
                    <p className="mt-1 text-xs text-neutral-500" data-testid="bom-note">
                      {r.note}
                    </p>
                  ) : null}
                  {/* Phones: the hidden columns, folded under the part. */}
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 xsmall:hidden">
                    <span>
                      {r.qtyPerUnit} per {unitNoun}
                      {r.unitPrice !== null ? ` · ${money(r.unitPrice)} each` : ""}
                    </span>
                    <span className={clx("inline-block border px-1.5 py-0.5 font-medium", STOCK_CLS[r.stock])}>{r.stockLabel}</span>
                  </p>
                </td>
                <td className="hidden px-3 py-3 text-right tabular-nums xsmall:table-cell">{r.qtyPerUnit}</td>
                <td className="px-2 py-3 text-right tabular-nums xsmall:px-3">{r.qtyTotal}</td>
                <td className="hidden px-3 py-3 text-right tabular-nums xsmall:table-cell">{price(r.unitPrice, r)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{price(r.lineTotal, r)}</td>
                <td className="hidden px-4 py-3 xsmall:table-cell">
                  <span className={clx("inline-block border px-2 py-0.5 text-xs font-medium", STOCK_CLS[r.stock])}>{r.stockLabel}</span>
                  <p className="mt-1 text-xs text-neutral-500">{r.leadTime}</p>
                </td>
              </tr>
            ))}
          </tbody>
          {total !== null ? (
            <tfoot>
              <tr className="border-t border-neutral-200 bg-neutral-50">
                <td colSpan={2} className="px-4 py-3 text-right text-sm font-semibold text-neutral-900 xsmall:hidden">
                  Total
                </td>
                <td colSpan={4} className="hidden px-4 py-3 text-right text-sm font-semibold text-neutral-900 xsmall:table-cell">
                  Total
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-neutral-900" data-testid="bom-total">
                  {money(total)}
                </td>
                <td className="hidden xsmall:table-cell" />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  )
}

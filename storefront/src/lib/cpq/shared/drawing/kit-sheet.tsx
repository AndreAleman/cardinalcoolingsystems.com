// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// CDU Hookup Kit sheet: no solid (B8), so the sheet is the kit's BOM table in the Cardinal chrome:
// one row per line with its preferred SKU, quantity per CDU and in total, and the lead time. Used for
// the kit PDF. Plain SVG, no hooks.

import type { Bom } from "../types"
import { fitFontSize } from "./layout"
import { PART, SheetChrome, THIN, type SheetProps } from "./sheet-chrome"
import { frameBox, stripBox } from "./layout"

export type KitSheetProps = Omit<SheetProps<unknown>, "geometry"> & {
  bom: Bom
  weightLb: number
  /** The resolver's SKU per line (index-aligned with bom.lines); otherwise the candidates are listed. */
  resolvedSkus?: (string | null)[]
}

const COLS = [
  { key: "n", label: "#", w: 28 },
  { key: "label", label: "DESCRIPTION", w: 470 },
  { key: "sku", label: "SKU", w: 150 },
  { key: "qty", label: "QTY / CDU", w: 80 },
  { key: "total", label: "QTY TOTAL", w: 80 },
  { key: "lead", label: "LEAD", w: 100 },
] as const

export function KitSheet({ bom, weightLb, resolvedSkus, partNumber, description, standardRange, drawnDate, logoHref, pricingMode, print, className }: KitSheetProps) {
  const f = frameBox()
  const strip = stripBox()
  const x0 = f.x + 24
  const y0 = f.y + 40
  const rowH = 20
  const maxRows = Math.floor((strip.y - 16 - (y0 + rowH)) / rowH)
  const rows = bom.lines.slice(0, maxRows)
  const xs: number[] = []
  let acc = x0
  for (const c of COLS) {
    xs.push(acc)
    acc += c.w
  }
  const width = acc - x0
  const cell = (l: Bom["lines"][number], i: number): string[] => [
    String(i + 1),
    l.label,
    (resolvedSkus && resolvedSkus[i]) ||
      (l.candidates.length ? l.candidates.join(" | ") : l.part_number ? l.part_number : "QUOTE"),
    String(l.qty_per_unit),
    String(l.qty_per_unit * bom.units),
    l.lead_time === "stock" ? "STOCK" : "CUSTOM",
  ]
  const notes = [`${bom.units} CDU${bom.units === 1 ? "" : "S"}; QUANTITIES PER CDU AND IN TOTAL`]
  if (bom.lines.length > rows.length) notes.push(`${bom.lines.length - rows.length} MORE LINES ON THE QUOTE`)
  return (
    <SheetChrome
      titleBlock={{ partNumber, description, drawnDate, weightLb, logoHref }}
      reviewReasons={standardRange.ok ? null : standardRange.reasons.map((r) => r.message)}
      notes={notes}
      pricingMode={pricingMode}
      print={print}
      className={className}
    >
      <g data-part="cdu-kit" fontFamily="Arial, Helvetica, sans-serif">
        <text x={x0} y={y0 - 12} fontSize={15} fontWeight={700} fill={PART}>
          BILL OF MATERIALS
        </text>
        <rect x={x0} y={y0} width={width} height={rowH} fill={PART} />
        {COLS.map((c, i) => (
          <text key={c.key} x={xs[i] + 5} y={y0 + 14} fontSize={10} fontWeight={700} fill="#ffffff">
            {c.label}
          </text>
        ))}
        {rows.map((l, r) => {
          const y = y0 + rowH * (r + 1)
          const values = cell(l, r)
          return (
            <g key={r} data-bom-row={l.role}>
              <rect x={x0} y={y} width={width} height={rowH} fill={r % 2 ? "#f4f4f4" : "#ffffff"} stroke={THIN} strokeWidth={0.4} />
              {values.map((v, i) => (
                <text key={i} x={xs[i] + 5} y={y + 14} fontSize={fitFontSize(v, COLS[i].w - 10, 11, 7)} fill={PART}>
                  {v}
                </text>
              ))}
            </g>
          )
        })}
      </g>
    </SheetChrome>
  )
}

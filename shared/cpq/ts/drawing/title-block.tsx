// Title block + logo strip (ported from Sanitube's title-block.tsx; DWG NO = Part Number), with
// Cardinal branding: black ink, the Cardinal logo and "CARDINAL COOLING SYSTEMS". Plain SVG, no hooks.

import type { Box } from "./dimension-layout"
import { fitFontSize, wrapText } from "./layout"
import { formatLb } from "../units"

export const INK = "#0a0a0a" // Cardinal black
export const BRAND = "#D72638" // Cardinal red
export const COMPANY = "CARDINAL COOLING SYSTEMS"
const LABEL = 8.5
const TOLERANCES = [
  "UNLESS OTHERWISE SPECIFIED",
  "DIMENSIONS AND TOLERANCES",
  "IN INCH TOLERANCES",
  "ONE PLACE DECIMAL ± .1",
  "TWO PLACE DECIMAL ± .03",
  "THREE PLACE DECIMAL ± .015",
  "HOLE DIA ± .005",
]

export type PricingModeTag = "instant" | "quote"

export type TitleBlockProps = {
  box: Box
  strip: Box
  partNumber: string
  description: string
  drawnDate: string
  weightLb: number
  notes: string[]
  /** Logo image href: storefront "/images/logo/cardinal-logo-ink.svg", PDF render "cardinal-logo.svg". */
  logoHref: string
  /** Quote mode adds "CERTIFIED DRAWING ON QUOTE APPROVAL" (spec "Shared components"). */
  pricingMode: PricingModeTag
}

function Cell({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label?: string }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={0.9} />
      {label ? (
        <text x={x + 3} y={y + 9} fontSize={LABEL} fill={INK}>
          {label}
        </text>
      ) : null}
    </>
  )
}

export function TitleBlock({
  box,
  strip,
  partNumber,
  description,
  drawnDate,
  weightLb,
  notes,
  logoHref,
  pricingMode,
}: TitleBlockProps) {
  const { x, y } = box
  const leftW = 190
  const rx = x + leftW
  const rw = box.w - leftW

  const pnSize = fitFontSize(partNumber, rw - 12, 22)
  const dwgW = rw - 94 - 40
  const dwgSize = fitFontSize(partNumber, dwgW - 12, 13, 7)
  // Two lines up to 16 px; a description too long for that wraps to three smaller lines.
  let descLines = wrapText(description.toUpperCase(), 30, 2)
  let descSize = Math.min(...descLines.map((l) => fitFontSize(l, rw - 12, 16)))
  let descStep = descSize + 3
  let descTop = 28
  if (descLines.some((l) => l.length * descSize * 0.62 > rw - 12)) {
    descLines = wrapText(description.toUpperCase(), 46, 3)
    descSize = Math.min(11, ...descLines.map((l) => fitFontSize(l, rw - 12, 11, 6)))
    descStep = 13.5
    descTop = 22
  }

  const head = pricingMode === "quote" ? ["CERTIFIED DRAWING ON QUOTE APPROVAL", "Reference only until then."] : ["Reference only."]
  const noteLines = [...head, ...notes]

  return (
    <g fontFamily="Arial, Helvetica, sans-serif">
      {/* Logo strip */}
      <image href={logoHref} x={strip.x} y={strip.y + 3} width={180} height={31} preserveAspectRatio="xMinYMid meet" />
      <text x={strip.x} y={strip.y + 50} fontSize={11} fontWeight={700} fill={INK} letterSpacing={0.6}>
        {COMPANY}
      </text>
      {noteLines.map((t, i) => (
        <text
          key={i}
          x={strip.x + strip.w - 6}
          y={strip.y + 16 + i * 13}
          fontSize={i === 0 && pricingMode === "quote" ? 10.5 : 9.5}
          fontWeight={i === 0 && pricingMode === "quote" ? 700 : undefined}
          fontStyle={i < head.length && !(i === 0 && pricingMode === "quote") ? "italic" : undefined}
          fill={i === 0 && pricingMode === "quote" ? BRAND : INK}
          textAnchor="end"
        >
          {t}
        </text>
      ))}

      {/* Tolerance block + sign-off rows */}
      <Cell x={x} y={y} w={leftW} h={96} />
      {TOLERANCES.map((t, i) => (
        <text key={t} x={x + 5} y={y + 14 + i * 11.6} fontSize={9.3} fill={INK}>
          {t}
        </text>
      ))}
      <Cell x={x} y={y + 96} w={leftW} h={18} label="APPROVED" />
      <Cell x={x} y={y + 114} w={leftW} h={18} label="CHECKED" />
      <Cell x={x} y={y + 132} w={leftW} h={18} label="DRAWN" />
      <text x={x + 62} y={y + 145} fontSize={10.5} fill={INK}>
        AUTO
      </text>
      <text x={x + leftW - 5} y={y + 145} fontSize={10.5} fill={INK} textAnchor="end">
        {drawnDate}
      </text>

      {/* Part number + description */}
      <Cell x={rx} y={y} w={rw} h={40} label="PART#" />
      <text x={rx + 6} y={y + 33} fontSize={pnSize} fill={INK}>
        {partNumber}
      </text>
      <Cell x={rx} y={y + 40} w={rw} h={56} label="DESCRIPTION" />
      {descLines.map((l, i) => (
        <text key={i} x={rx + 6} y={y + 40 + descTop + i * descStep} fontSize={descSize} fill={INK}>
          {l}
        </text>
      ))}

      {/* SIZE | CODE | DWG NO | REV */}
      <Cell x={rx} y={y + 96} w={34} h={36} label="SIZE" />
      <text x={rx + 17} y={y + 126} fontSize={13} fill={INK} textAnchor="middle">
        B
      </text>
      <Cell x={rx + 34} y={y + 96} w={60} h={36} label="CODE" />
      <text x={rx + 64} y={y + 126} fontSize={10} fill={INK} textAnchor="middle">
        CCS
      </text>
      <Cell x={rx + 94} y={y + 96} w={dwgW} h={36} label="DWG NO" />
      <text x={rx + 94 + 6} y={y + 126} fontSize={dwgSize} fill={INK}>
        {partNumber}
      </text>
      <Cell x={rx + rw - 40} y={y + 96} w={40} h={36} label="REV" />

      {/* SCALE | WEIGHT | SHEET */}
      <Cell x={rx} y={y + 132} w={94} h={18} label="SCALE" />
      <text x={rx + 40} y={y + 145} fontSize={10.5} fill={INK}>
        NTS
      </text>
      <Cell x={rx + 94} y={y + 132} w={rw - 94 - 80} h={18} label="WEIGHT" />
      <text x={rx + 94 + 46} y={y + 145} fontSize={10.5} fill={INK}>
        {`≈ ${formatLb(weightLb)} LB`}
      </text>
      <Cell x={rx + rw - 80} y={y + 132} w={80} h={18} label="SHEET" />
      <text x={rx + rw - 40} y={y + 145} fontSize={10.5} fill={INK}>
        1/1
      </text>
    </g>
  )
}

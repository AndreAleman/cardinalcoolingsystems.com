// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Sheet chrome shared by every Engineering View sheet (ported from Sanitube's sheet-chrome.tsx, with
// Cardinal colors): the root <svg>, the white sheet, the frame with centring marks, the title block
// + logo/notes strip, and the ENGINEERING REVIEW stamp. Each builder draws only its part view as
// `children`. Plain SVG (no masks, no clip paths, no filters) so CairoSVG renders the PDF the same way.

import type { ReactNode, SVGProps } from "react"
import type { Box } from "./dimension-layout"
import { SHEET, frameBox, titleBox, stripBox, stampOrigin } from "./layout"
import { n2 } from "./svg-path"
import { BRAND, INK, TitleBlock, type PricingModeTag } from "./title-block"

export const PART = INK
export const THIN = "#6b6b6b"
export const REVIEW = BRAND

export function Line({ a, b, ...rest }: { a: [number, number]; b: [number, number] } & SVGProps<SVGLineElement>) {
  return <line x1={n2(a[0])} y1={n2(a[1])} x2={n2(b[0])} y2={n2(b[1])} {...rest} />
}

/** Sheet frame with centring marks. */
export function Frame({ x, y, w, h }: Box) {
  const cx = x + w / 2
  const cy = y + h / 2
  const t = 7
  return (
    <g fill="none" stroke={PART} strokeWidth={1}>
      <rect x={x} y={y} width={w} height={h} />
      <path d={`M${cx - t} ${y - t} L${cx + t} ${y - t} L${cx} ${y + 2} Z`} />
      <path d={`M${cx - t} ${y + h + t} L${cx + t} ${y + h + t} L${cx} ${y + h - 2} Z`} />
      <path d={`M${x - t} ${cy - t} L${x - t} ${cy + t} L${x + 2} ${cy} Z`} />
      <path d={`M${x + w + t} ${cy - t} L${x + w + t} ${cy + t} L${x + w - 2} ${cy} Z`} />
    </g>
  )
}

export function ReviewStamp({ x, y, reasons }: { x: number; y: number; reasons: string[] }) {
  return (
    <g data-stamp="engineering-review">
      <g transform={`rotate(-5 ${x + 140} ${y + 22})`}>
        <rect x={x} y={y} width={280} height={44} rx={4} fill="#ffffff" fillOpacity={0.85} stroke={REVIEW} strokeWidth={3} />
        <text x={x + 140} y={y + 29} fontSize={20} fontWeight={700} fill={REVIEW} textAnchor="middle" letterSpacing={1}>
          ENGINEERING REVIEW
        </text>
      </g>
      {reasons.map((r, i) => (
        <text key={i} x={x + 280} y={y + 72 + i * 14} fontSize={11.5} fill={REVIEW} textAnchor="end">
          {r}
        </text>
      ))}
    </g>
  )
}

/** Props every per-builder sheet takes. */
export type SheetProps<G> = {
  geometry: G
  partNumber: string
  description: string
  standardRange: { ok: boolean; reasons: { message: string }[] }
  /** "10/18/2026" */
  drawnDate: string
  /** Storefront "/images/logo/new-cardinal-cooling-logo.svg"; backend PDF render "cardinal-logo.svg". */
  logoHref: string
  /** Quote (default) adds "CERTIFIED DRAWING ON QUOTE APPROVAL". */
  pricingMode?: PricingModeTag
  /** Adds width="17in" height="11in" (ANSI B landscape) to the root <svg>. Drawing unchanged. */
  print?: boolean
  className?: string
}

export type SheetTitleBlock = {
  partNumber: string
  /** Title block DESCRIPTION; also the sheet's <title> and aria-label. */
  description: string
  drawnDate: string
  weightLb: number
  logoHref: string
}

export type SheetChromeProps = {
  titleBlock: SheetTitleBlock
  /** Standard Range reason messages; null (or within range) = no stamp. */
  reviewReasons: string[] | null
  /** Extra notes under the reference note in the strip. */
  notes: string[]
  pricingMode?: PricingModeTag
  print?: boolean
  className?: string
  /** The part view, drawn between the frame and the title block. */
  children?: ReactNode
}

export function SheetChrome({ titleBlock, reviewReasons, notes, pricingMode, print, className, children }: SheetChromeProps) {
  const [stampX, stampY] = stampOrigin()
  return (
    <svg
      viewBox={`0 0 ${SHEET.w} ${SHEET.h}`}
      width={print ? "17in" : undefined}
      height={print ? "11in" : undefined}
      role="img"
      aria-label={titleBlock.description}
      className={className}
      fontFamily="Arial, Helvetica, sans-serif"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{titleBlock.description}</title>
      <rect x={0} y={0} width={SHEET.w} height={SHEET.h} fill="#ffffff" />
      <Frame {...frameBox()} />

      {children}

      <TitleBlock
        box={titleBox()}
        strip={stripBox()}
        partNumber={titleBlock.partNumber}
        description={titleBlock.description}
        drawnDate={titleBlock.drawnDate}
        weightLb={titleBlock.weightLb}
        notes={notes}
        logoHref={titleBlock.logoHref}
        pricingMode={pricingMode ?? "quote"}
      />

      {reviewReasons ? <ReviewStamp x={stampX} y={stampY} reasons={reviewReasons} /> : null}
    </svg>
  )
}

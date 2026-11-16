// Engineering View sheet for a Row Manifold: the header with drops at pitch (broken view past five
// drops), header ends and ports labelled, overall length, pitch, drop height and header OD
// dimensioned (manifold-layout.ts). Plain SVG, no hooks.

import type { ManifoldGeometry } from "../types"
import { Dimension, DimLabel } from "./dimension"
import { PORT_TAG_FONT, layoutManifold } from "./manifold-layout"
import { Line, PART, SheetChrome, THIN, type SheetProps } from "./sheet-chrome"
import { reviewStampBox } from "./layout"

export type ManifoldSheetProps = SheetProps<ManifoldGeometry>

export function ManifoldSheet({
  geometry,
  partNumber,
  description,
  standardRange,
  drawnDate,
  logoHref,
  pricingMode,
  print,
  className,
}: ManifoldSheetProps) {
  const reasons = standardRange.ok ? [] : standardRange.reasons.map((r) => r.message)
  const l = layoutManifold(geometry, reasons.length ? [reviewStampBox(reasons)] : [])
  return (
    <SheetChrome
      titleBlock={{ partNumber, description, drawnDate, weightLb: geometry.approxWeightLb, logoHref }}
      reviewReasons={reasons.length ? reasons : null}
      notes={l.notes}
      pricingMode={pricingMode}
      print={print}
      className={className}
    >
      <g data-part="row-manifold">
        <g stroke={THIN} strokeWidth={0.8} strokeDasharray="14 4 2 4" fill="none">
          {l.centerlines.map(([a, b], i) => (
            <Line key={i} a={a} b={b} />
          ))}
          {l.branches.map((b, i) => (
            <Line key={`c${i}`} a={b.centerline[0]} b={b.centerline[1]} />
          ))}
        </g>
        <g fill="none" stroke={PART} strokeWidth={0.8} strokeDasharray="5 3">
          {l.borePaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g fill="none" stroke={PART} strokeWidth={1.6} strokeLinejoin="round">
          {l.headerPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
          {l.faceLines.map(([a, b], i) => (
            <Line key={`f${i}`} a={a} b={b} />
          ))}
          {l.branches.map((b, i) => (
            <g key={`w${i}`}>
              {b.walls.map(([p, q], k) => (
                <Line key={k} a={p} b={q} />
              ))}
              {b.faceLine ? <Line a={b.faceLine[0]} b={b.faceLine[1]} /> : null}
            </g>
          ))}
        </g>
        {l.breakPaths.length > 0 ? (
          <g data-break="" fill="none" stroke={PART} strokeWidth={1.1} strokeLinejoin="round">
            {l.breakPaths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        ) : null}
        {[...l.endOutlines, ...l.branches.map((b) => b.outline).filter((o): o is NonNullable<typeof o> => o !== null)].map((e, i) => (
          <g key={`e${i}`}>
            <path d={e.d} fill="#ffffff" stroke={PART} strokeWidth={1.6} strokeLinejoin="round" />
            {e.weld ? <Line a={e.weld[0]} b={e.weld[1]} stroke={PART} strokeWidth={0.8} /> : null}
          </g>
        ))}
        {l.branches
          .filter((b) => b.valve)
          .map((b, i) => (
            <g key={`v${i}`} data-valve="">
              <path d={b.valve!.d} fill="#ffffff" stroke={PART} strokeWidth={1.4} />
              <Line a={b.valve!.handle[0]} b={b.valve!.handle[1]} stroke={PART} strokeWidth={2} />
            </g>
          ))}
        {l.dims.map((d) => (
          <Dimension key={d.id} dim={d} />
        ))}
        {l.endTags.map((t, i) => (
          <DimLabel key={i} t={t} color={PART} size={i < 2 ? 13 : PORT_TAG_FONT} />
        ))}
      </g>
    </SheetChrome>
  )
}

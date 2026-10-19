// Draws the dimension primitives computed by dimension-layout.ts (ported from Sanitube, Cardinal
// colors). Plain SVG, no hooks, so it
// renders on the server and the client.

import type { Vec2 } from "../types"
import { DIM_STYLE, type DimGraphic, type DimText } from "./dimension-layout"
import { n2 } from "./svg-path"

export const DIM_COLOR = "#D72638" // Cardinal red

export function DimLabel({ t, color = DIM_COLOR, size = DIM_STYLE.font }: { t: DimText; color?: string; size?: number }) {
  return (
    <text
      x={n2(t.at[0])}
      y={n2(t.at[1])}
      fontSize={size}
      fill={color}
      textAnchor={t.anchor}
      dominantBaseline="central"
    >
      {t.text}
    </text>
  )
}

function pts(p: [Vec2, Vec2, Vec2]): string {
  return p.map((q) => `${n2(q[0])},${n2(q[1])}`).join(" ")
}

/** One linear / angular dimension or leader: thin lines, filled arrowheads, horizontal text. */
export function Dimension({ dim, color = DIM_COLOR }: { dim: DimGraphic; color?: string }) {
  return (
    <g data-dim={dim.id}>
      {dim.lines.map(([a, b], i) => (
        <line key={`l${i}`} x1={n2(a[0])} y1={n2(a[1])} x2={n2(b[0])} y2={n2(b[1])} stroke={color} strokeWidth={0.9} />
      ))}
      {dim.arcs.map((d, i) => (
        <path key={`a${i}`} d={d} fill="none" stroke={color} strokeWidth={0.9} />
      ))}
      {dim.arrows.map((a, i) => (
        <polygon key={`h${i}`} points={pts(a)} fill={color} />
      ))}
      {dim.texts.map((t, i) => (
        <DimLabel key={`t${i}`} t={t} color={color} />
      ))}
    </g>
  )
}

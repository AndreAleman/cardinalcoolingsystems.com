// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Pure layout of the Row Manifold Engineering View. No React, no DOM.
//
// Model (builder-row-manifold.ts): inches, Y up, header along +X (Face A at 0, Face B at L), drops
// toward +Y, fill/drain toward −Y. Sheet px, Y down.
//
// Dimensions: overall header length (below), drop pitch between the first two drops (above), drop
// height header centerline → drop face (right of the first drop), header OD at Face B. End styles
// are tagged "A (TC)" / "B (CAP)", ports beside their faces. With more than MANIFOLD_BREAK_DROPS
// drops the header is broken between the second drop and the last; the length reads true.

import { endConnectionType, formatDim, formatInches } from "../index"
import type { ManifoldBranch, ManifoldGeometry, Vec2 } from "../types"
import { add, linearDimension, textBox, type Box, type DimGraphic, type DimText } from "./dimension-layout"
import type { EndOutline } from "./layout"
import { ROW1, endOutlineAt, fitToSheet, runEndTags, sheetBoxes, type PartLayoutBase } from "./part-layout"
import { polylineToPath, toSheet, type SheetTransform } from "./svg-path"

/** More drops than this → broken view showing the first two drops and the last one. */
export const MANIFOLD_BREAK_DROPS = 4
export const PORT_TAG_FONT = 11

export type ManifoldDisplay = {
  broken: boolean
  length: number
  breaks: [number, number] | null
  x: (mx: number) => number
  /** Drop indexes drawn. */
  shownDrops: number[]
}

export function manifoldDisplay(g: ManifoldGeometry): ManifoldDisplay {
  const drops = g.branches.filter((b) => b.role === "drop")
  const n = drops.length
  const L = g.header.length
  const all = drops.map((_, i) => i)
  if (n <= MANIFOLD_BREAK_DROPS) return { broken: false, length: L, breaks: null, x: (mx) => mx, shownDrops: all }
  const gap = g.header.od
  const c0 = drops[1].x + g.pitch / 2
  const c1 = drops[n - 1].x - g.pitch / 2
  const cut = c1 - c0 - gap
  if (cut <= 0) return { broken: false, length: L, breaks: null, x: (mx) => mx, shownDrops: all }
  return {
    broken: true,
    length: L - cut,
    breaks: [c0, c0 + gap],
    x: (mx) => (mx <= c0 ? mx : mx >= c1 ? mx - cut : c0 + ((mx - c0) / (c1 - c0)) * gap),
    shownDrops: [0, 1, n - 1],
  }
}

export type BranchDraw = {
  role: ManifoldBranch["role"]
  walls: [Vec2, Vec2][]
  outline: EndOutline | null
  faceLine: [Vec2, Vec2] | null
  valve: { d: string; handle: [Vec2, Vec2] } | null
  centerline: [Vec2, Vec2]
}

export type ManifoldLayout = PartLayoutBase & {
  broken: boolean
  headerPaths: string[]
  borePaths: string[]
  centerlines: [Vec2, Vec2][]
  faceLines: [Vec2, Vec2][]
  endOutlines: EndOutline[]
  branches: BranchDraw[]
  breakPaths: string[]
  portTags: DimText[]
  notes: string[]
}

const PORT_TAG: Record<ManifoldBranch["role"], string> = { drop: "", fill: "FILL", drain: "DRAIN", vent: "VENT", instrument: "T/P" }

function extents(g: ManifoldGeometry, disp: ManifoldDisplay) {
  return { minX: Math.min(0, g.bbox.minX), minY: g.bbox.minY, maxX: disp.length, maxY: g.bbox.maxY }
}

function buildAt(g: ManifoldGeometry, disp: ManifoldDisplay, tf: SheetTransform, reserved: Box[]): ManifoldLayout {
  const S = (p: Vec2) => toSheet(p, tf)
  const s = tf.scale
  const { frame, title, strip } = sheetBoxes()
  const h = g.header
  const D = disp.length
  const r = h.od / 2
  const ri = h.id / 2
  const xa = h.ends.a.length
  const xb = D - h.ends.b.length

  // Header walls and bore, split at the break.
  const runs: [number, number][] = disp.breaks ? [[xa, disp.breaks[0]], [disp.breaks[1], xb]] : [[xa, xb]]
  const headerPaths: string[] = []
  const borePaths: string[] = []
  const partOutline: Vec2[][] = []
  for (const [x0, x1] of runs) {
    for (const y of [r, -r]) {
      const seg = [S([x0, y]), S([x1, y])]
      headerPaths.push(polylineToPath(seg))
      partOutline.push(seg)
    }
    for (const y of [ri, -ri]) borePaths.push(polylineToPath([S([x0, y]), S([x1, y])]))
  }
  const breakPaths: string[] = []
  if (disp.breaks) {
    for (const x of disp.breaks) {
      const hh = r + 0.18 * h.od
      const d = 0.22 * h.od
      const w = 0.12 * h.od
      const poly = ([[x, -hh], [x, -d], [x + w, -d / 3], [x - w, d / 3], [x, d], [x, hh]] as Vec2[]).map(S)
      breakPaths.push(polylineToPath(poly))
      partOutline.push(poly)
    }
  }

  const faceLines: [Vec2, Vec2][] = []
  const endOutlines: EndOutline[] = []
  for (const [face, dir, e] of [
    [[0, 0] as Vec2, [-1, 0] as Vec2, h.ends.a],
    [[D, 0] as Vec2, [1, 0] as Vec2, h.ends.b],
  ] as const) {
    const o = endOutlineAt(face, dir, e, h.od, S)
    if (o.outline) {
      endOutlines.push(o.outline)
      partOutline.push([...o.outline.poly, o.outline.poly[0]])
    } else {
      faceLines.push(o.faceLine)
      partOutline.push(o.faceLine)
    }
  }

  // Branches (drops shown + every port).
  const drops = g.branches.filter((b) => b.role === "drop")
  const shown = [...disp.shownDrops.map((i) => drops[i]), ...g.branches.filter((b) => b.role !== "drop")]
  const branches: BranchDraw[] = []
  const portTags: DimText[] = []
  for (const b of shown) {
    const x = disp.x(b.x)
    const sd = b.side
    const br = b.od / 2
    const yWeld = sd * (b.height - b.end.length)
    const walls: [Vec2, Vec2][] = [
      [S([x - br, sd * r]), S([x - br, yWeld])],
      [S([x + br, sd * r]), S([x + br, yWeld])],
    ]
    walls.forEach((w) => partOutline.push([w[0], w[1]]))
    const o = endOutlineAt([x, sd * b.height], [0, sd], b.end, b.od, S)
    if (o.outline) partOutline.push([...o.outline.poly, o.outline.poly[0]])
    else partOutline.push(o.faceLine)
    let valve: BranchDraw["valve"] = null
    if (b.valve) {
      const vw = b.od * 1.6
      const y0 = sd * b.height
      const y1 = sd * (b.height + b.valve.length)
      const poly = ([[x - vw / 2, y0], [x + vw / 2, y0], [x + vw / 2, y1], [x - vw / 2, y1]] as Vec2[]).map(S)
      const mid = sd * (b.height + b.valve.length / 2)
      valve = { d: polylineToPath(poly, true), handle: [S([x + vw / 2, mid]), S([x + vw / 2 + b.od * 1.4, mid])] }
      partOutline.push([...poly, poly[0]])
    }
    const top = sd * (b.height + (b.valve ? b.valve.length : 0))
    branches.push({
      role: b.role,
      walls,
      outline: o.outline,
      faceLine: o.faceLine,
      valve,
      centerline: [S([x, sd * (r - 0.1)]), add(S([x, top]), [0, -sd], 10)],
    })
    const firstOfRole = g.branches.find((q) => q.role === b.role) === b
    if (b.role !== "drop" && firstOfRole) {
      const count = g.branches.filter((q) => q.role === b.role).length
      // Beyond the port face (above a top port, below a bottom one), centred on the port.
      const pos = add(S([x, sd * b.height]), [0, -sd], 11)
      const text = `${count > 1 ? `${count}× ` : ""}${PORT_TAG[b.role]} ${formatInches(b.od)}`
      const anchor = "middle"
      portTags.push({ at: pos, text, anchor, box: textBox(pos, text, PORT_TAG_FONT, anchor) })
    }
  }

  const centerlines: [Vec2, Vec2][] = disp.breaks
    ? [
        [add(S([0, 0]), [-1, 0], 12), S([disp.breaks[0], 0])],
        [S([disp.breaks[1], 0]), add(S([D, 0]), [1, 0], 12)],
      ]
    : [[add(S([0, 0]), [-1, 0], 12), add(S([D, 0]), [1, 0], 12)]]

  // Dimensions.
  const dims: DimGraphic[] = []
  const lowest = Math.max(r, h.ends.a.maxOd / 2, h.ends.b.maxOd / 2, ...g.branches.filter((b) => b.side === -1).map((b) => b.height))
  const bottomTags = g.branches.some((b) => b.side === -1)
  const tagY = S([0, -lowest])[1] + (bottomTags ? 32 : 18)
  const endTags: DimText[] = runEndTags(
    tagY,
    { faceX: S([0, 0])[0], weldX: S([xa, 0])[0], text: `A (${endConnectionType(h.ends.a.code).short})` },
    { faceX: S([D, 0])[0], weldX: S([xb, 0])[0], text: `B (${endConnectionType(h.ends.b.code).short})` },
  )
  const down: Vec2 = [0, 1]
  const up: Vec2 = [0, -1]
  dims.push(
    linearDimension({
      id: "overall-length",
      a: S([0, 0]),
      b: S([D, 0]),
      normal: down,
      offset: lowest * s + ROW1 + (bottomTags ? 26 : 12),
      clearA: (h.ends.a.maxOd / 2) * s + 3,
      clearB: (h.ends.b.maxOd / 2) * s + 3,
      label: formatDim(h.length),
    }),
  )
  if (drops.length >= 2) {
    const d0 = drops[0]
    const d1 = drops[1]
    const topY = d0.height + (d0.valve ? d0.valve.length : 0)
    const clear = (topY - d0.height) * s + 3
    dims.push(
      linearDimension({
        id: "pitch",
        a: S([disp.x(d0.x), d0.height]),
        b: S([disp.x(d1.x), d1.height]),
        normal: up,
        offset: clear + ROW1,
        clearA: clear,
        clearB: clear,
        label: formatDim(g.pitch),
      }),
    )
  }
  if (drops.length) {
    const d0 = drops[0]
    const rr = (Math.max(d0.od, d0.end.maxOd) / 2) * s
    dims.push(
      linearDimension({
        id: "drop-height",
        a: S([disp.x(d0.x), 0]),
        b: S([disp.x(d0.x), d0.height]),
        normal: [1, 0],
        offset: rr + 22,
        clearA: rr + 3,
        clearB: rr + 3,
        label: formatDim(g.dropHeight),
      }),
    )
  }
  dims.push(
    linearDimension({
      id: "od",
      a: S([D, r]),
      b: S([D, -r]),
      normal: [1, 0],
      offset: ROW1 + Math.max(0, (h.ends.b.maxOd / 2 - r) * s),
      clearA: 3,
      clearB: 3,
      label: `Ø${formatDim(h.od)}`,
    }),
  )

  const d0 = drops[0]
  const notes = [
    `${drops.length} DROPS @ ${formatDim(g.pitch)} PITCH, ${formatInches(d0 ? d0.od : 0)} ${d0 && d0.valve ? "BALL VALVE" : d0 && d0.end.code === "bw" ? "UQD-READY STUB" : "TC"} (TYP)`,
  ]
  if (disp.broken) notes.push(`${drops.length - disp.shownDrops.length} DROP${drops.length - disp.shownDrops.length === 1 ? "" : "S"} NOT SHOWN (BROKEN VIEW)`)

  return {
    frame,
    title,
    strip,
    tf,
    broken: disp.broken,
    headerPaths,
    borePaths,
    centerlines,
    faceLines,
    endOutlines,
    branches,
    breakPaths,
    portTags,
    dims,
    endTags: [...endTags, ...portTags],
    notes,
    partOutline,
    reserved,
  }
}

export function layoutManifold(g: ManifoldGeometry, reserved: Box[] = []): ManifoldLayout {
  const disp = manifoldDisplay(g)
  return fitToSheet(extents(g, disp), (tf) => buildAt(g, disp, tf, reserved))
}

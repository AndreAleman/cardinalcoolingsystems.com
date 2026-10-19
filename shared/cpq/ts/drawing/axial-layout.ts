// Pure layout of an axisymmetric part along +X (generalises Sanitube's spool-layout.ts): the
// Transition Spool, the Strainer and the Hose Assembly. No React, no DOM.
//
// Model: inches, Y up, Face A at (0,0) facing −X, Face B at (L,0) facing +X; between the End
// Connections a run of AxialSegments (tube, cone, body, hose). The sheet is px with Y down.
//
// When L / max OD > AXIAL_BREAK_RATIO and the longest straight tube/hose segment is long enough,
// the part is drawn as a broken view: the middle of that segment is removed and replaced by a gap of
// one OD between two zig-zag break lines. Everything then works in "display" x; the overall length
// dimension still reads the true length.

import { endConnectionType, formatDim } from "../index"
import type { AxialSegment, EndGeom, Vec2 } from "../types"
import { add, linearDimension, unit, type Box, type DimGraphic, type DimText } from "./dimension-layout"
import type { EndOutline } from "./layout"
import {
  ROW1,
  ROW2,
  bestGraphic,
  dimsConflict,
  endOutlineAt,
  fitToSheet,
  leaderCandidates,
  runEndTags,
  sheetBoxes,
  type PartLayoutBase,
} from "./part-layout"
import { dirToSheet, polylineToPath, toSheet, type SheetTransform } from "./svg-path"

export const AXIAL_BREAK_RATIO = 12
const BREAK_KEEP_OD = 3
const BREAK_GAP_OD = 1
const ROW3 = 98
/** An end wider than this × the tube OD (a flange) gets an OD leader instead of a face dimension. */
const FLANGE_LIKE = 1.6

export type AxialPartInput = {
  /** True face-to-face length. */
  length: number
  ends: { a: EndGeom; b: EndGeom }
  /** Tube OD at Face A / Face B (differ on a reducing transition). */
  odA: number
  odB: number
  segments: AxialSegment[]
  /** End tags under the part, e.g. "A (TC)". Defaults from the End Connection codes. */
  tags?: { a: string; b: string }
  /** Dimension each End Connection's length (weld → face), as on the spool sheet. */
  endDims?: boolean
  /** Extra length dimensions in the first row (model x, true values), e.g. a strainer body. */
  extraDims?: { id: string; x0: number; x1: number; label: string }[]
  /** Word after the OD in a leader on a flanged side ("Ø2 TUBE"); default "TUBE". */
  odNoun?: string
  /** Wall leader text value (e.g. .065); null = none. */
  wall?: number | null
  notes?: string[]
}

export type AxialDisplay = {
  broken: boolean
  length: number
  /** Display x of the two break lines, or null. */
  breaks: [number, number] | null
  /** Model x → display x. */
  x: (mx: number) => number
  /** Model x range removed (null when not broken). */
  removed: [number, number] | null
}

export function axialDisplay(p: AxialPartInput): AxialDisplay {
  const L = p.length
  const od = Math.max(p.odA, p.odB)
  const ident: AxialDisplay = { broken: false, length: L, breaks: null, x: (mx) => mx, removed: null }
  if (!(L / od > AXIAL_BREAK_RATIO)) return ident
  const straight = p.segments
    .filter((s) => (s.style === "tube" || s.style === "hose") && Math.abs(s.r0 - s.r1) < 1e-9)
    .sort((s, t) => t.x1 - t.x0 - (s.x1 - s.x0))[0]
  const keep = BREAK_KEEP_OD * od
  const gap = BREAK_GAP_OD * od
  if (!straight || straight.x1 - straight.x0 < 2 * keep + 2 * gap) return ident
  const b0 = straight.x0 + keep
  const b1 = straight.x1 - keep
  const cut = b1 - b0 - gap
  return {
    broken: true,
    length: L - cut,
    breaks: [b0, b0 + gap],
    x: (mx) => (mx <= b0 ? mx : mx >= b1 ? mx - cut : b0 + ((mx - b0) / (b1 - b0)) * gap),
    removed: [b0, b1],
  }
}

export type AxialLayout = PartLayoutBase & {
  broken: boolean
  outerPaths: string[]
  innerPaths: string[]
  bodyPaths: string[]
  hosePaths: string[]
  braidPaths: string[]
  centerlines: [Vec2, Vec2][]
  faceLines: [Vec2, Vec2][]
  endOutlines: EndOutline[]
  breakPaths: string[]
  notes: string[]
}

function breakLine(x: number, r: number, od: number): Vec2[] {
  const h = r + 0.18 * od
  const d = 0.22 * od
  const w = 0.12 * od
  return [
    [x, -h],
    [x, -d],
    [x + w, -d / 3],
    [x - w, d / 3],
    [x, d],
    [x, h],
  ]
}

/** Segments in display x, split around the removed range. */
function displaySegments(p: AxialPartInput, disp: AxialDisplay): AxialSegment[] {
  const out: AxialSegment[] = []
  for (const s of p.segments) {
    if (disp.removed && s.x0 < disp.removed[0] && s.x1 > disp.removed[1]) {
      out.push({ ...s, x0: disp.x(s.x0), x1: disp.x(disp.removed[0]) })
      out.push({ ...s, x0: disp.x(disp.removed[1]), x1: disp.x(s.x1) })
    } else out.push({ ...s, x0: disp.x(s.x0), x1: disp.x(s.x1) })
  }
  return out
}

function maxRadius(p: AxialPartInput): number {
  return Math.max(
    p.odA / 2,
    p.odB / 2,
    p.ends.a.maxOd / 2,
    p.ends.b.maxOd / 2,
    ...p.segments.map((s) => Math.max(s.r0, s.r1)),
  )
}

function displayExtents(p: AxialPartInput, disp: AxialDisplay) {
  const od = Math.max(p.odA, p.odB)
  const y = Math.max(maxRadius(p), disp.broken ? od / 2 + 0.18 * od : 0)
  return { minX: 0, minY: -y, maxX: disp.length, maxY: y }
}

function buildAt(p: AxialPartInput, disp: AxialDisplay, tf: SheetTransform, reserved: Box[]): AxialLayout {
  const S = (q: Vec2) => toSheet(q, tf)
  const s = tf.scale
  const { frame, title, strip } = sheetBoxes()
  const D = disp.length
  const a = p.ends.a
  const b = p.ends.b
  const faceA: Vec2 = [0, 0]
  const faceB: Vec2 = [D, 0]
  const dirA: Vec2 = [-1, 0]
  const dirB: Vec2 = [1, 0]
  const weldAx = a.length
  const weldBx = D - b.length

  const segs = displaySegments(p, disp)
  const outerPaths: string[] = []
  const innerPaths: string[] = []
  const bodyPaths: string[] = []
  const hosePaths: string[] = []
  const braidPaths: string[] = []
  const partOutline: Vec2[][] = []
  for (const g of segs) {
    if (g.x1 - g.x0 <= 1e-9) continue
    const top = [S([g.x0, g.r0]), S([g.x1, g.r1])]
    const bot = [S([g.x0, -g.r0]), S([g.x1, -g.r1])]
    if (g.style === "body") {
      const poly = [top[0], top[1], bot[1], bot[0]]
      bodyPaths.push(polylineToPath(poly, true))
      partOutline.push([...poly, poly[0]])
    } else if (g.style === "hose") {
      hosePaths.push(polylineToPath(top), polylineToPath(bot))
      partOutline.push(top, bot)
      // Braid: short diagonals both ways across the hose, every 9 px.
      const x0 = top[0][0]
      const x1 = top[1][0]
      const yT = top[0][1]
      const yB = bot[0][1]
      const run = (yB - yT) * 0.5
      for (let x = x0 + 3; x + run <= x1 - 3; x += 9) {
        braidPaths.push(
          polylineToPath([[x, yT], [x + run, yB]] as Vec2[]),
          polylineToPath([[x + run, yT], [x, yB]] as Vec2[]),
        )
      }
    } else {
      outerPaths.push(polylineToPath(top), polylineToPath(bot))
      partOutline.push(top, bot)
    }
    if (g.ri0 !== null && g.ri1 !== null) {
      innerPaths.push(polylineToPath([S([g.x0, g.ri0]), S([g.x1, g.ri1])]), polylineToPath([S([g.x0, -g.ri0]), S([g.x1, -g.ri1])]))
    }
  }

  const odMax = Math.max(p.odA, p.odB)
  const breakPaths: string[] = []
  if (disp.breaks) {
    const r = Math.max(...p.segments.filter((g) => g.style === "tube" || g.style === "hose").map((g) => g.r0), p.odA / 2)
    for (const x of disp.breaks) {
      const poly = breakLine(x, r, odMax).map(S)
      breakPaths.push(polylineToPath(poly))
      partOutline.push(poly)
    }
  }

  const faceLines: [Vec2, Vec2][] = []
  const endOutlines: EndOutline[] = []
  for (const [face, dir, e, od] of [
    [faceA, dirA, a, p.odA],
    [faceB, dirB, b, p.odB],
  ] as const) {
    const r = endOutlineAt(face, dir, e, od, S)
    if (r.outline) {
      endOutlines.push(r.outline)
      partOutline.push([...r.outline.poly, r.outline.poly[0]])
    } else {
      faceLines.push(r.faceLine)
      partOutline.push(r.faceLine)
    }
  }

  const cl0 = add(S(faceA), [-1, 0], 12)
  const cl1 = add(S(faceB), [1, 0], 12)
  const centerlines: [Vec2, Vec2][] = disp.breaks
    ? [
        [cl0, S([disp.breaks[0], 0])],
        [S([disp.breaks[1], 0]), cl1],
      ]
    : [[cl0, cl1]]

  const hwA = (Math.max(p.odA, a.maxOd) / 2) * s
  const hwB = (Math.max(p.odB, b.maxOd) / 2) * s
  const hwMax = maxRadius(p) * s
  const up: Vec2 = [0, -1]

  const dims: DimGraphic[] = []
  const notes: string[] = [...(p.notes ?? [])]
  let row = ROW1
  if (p.endDims) {
    const endDim = (id: string, at: number, face: Vec2, hw: number, hwTube: number, len: number) =>
      linearDimension({
        id,
        a: S([at, 0]),
        b: S(face),
        normal: up,
        offset: hwMax + ROW1,
        clearA: hwTube + 3,
        clearB: hw + 3,
        label: formatDim(len),
      })
    let dimA = a.length > 0 ? endDim("end-a", weldAx, faceA, hwA, (p.odA / 2) * s, a.length) : null
    let dimB = b.length > 0 ? endDim("end-b", weldBx, faceB, hwB, (p.odB / 2) * s, b.length) : null
    if (dimA && dimB && dimsConflict(dimA, dimB)) {
      notes.push(`END CONNECTION LENGTHS: A ${formatDim(a.length)}, B ${formatDim(b.length)}`)
      dimA = null
      dimB = null
    }
    if (dimA) dims.push(dimA)
    if (dimB) dims.push(dimB)
    if (dimA || dimB) row = ROW2
  }
  const extras = p.extraDims ?? []
  if (extras.length) {
    const r = row
    for (const e of extras) {
      dims.push(
        linearDimension({
          id: e.id,
          a: S([disp.x(e.x0), 0]),
          b: S([disp.x(e.x1), 0]),
          normal: up,
          offset: hwMax + r,
          clearA: hwMax + 3,
          clearB: hwMax + 3,
          label: e.label,
        }),
      )
    }
    row = r === ROW1 ? ROW2 : ROW3
  }
  dims.push(
    linearDimension({
      id: "overall-length",
      a: S(faceA),
      b: S(faceB),
      normal: up,
      offset: hwMax + row,
      clearA: hwA + 3,
      clearB: hwB + 3,
      label: formatDim(p.length),
    }),
  )

  const tagY = S(faceA)[1] + hwMax + 16
  const tags = p.tags ?? {
    a: `A (${endConnectionType(a.code).short})`,
    b: `B (${endConnectionType(b.code).short})`,
  }
  const endTags: DimText[] = runEndTags(
    tagY,
    { faceX: S(faceA)[0], weldX: S([weldAx, 0])[0], text: tags.a },
    { faceX: S(faceB)[0], weldX: S([weldBx, 0])[0], text: tags.b },
  )
  const ctx = { frame, title, strip, partOutline, endTags, reserved }

  // Tube OD: at the face, as on Sanitube's spool sheet, unless the end is flange-like (much wider
  // than the tube): then a leader to the tube at the weld line.
  const dB = dirToSheet(dirB)
  const dA = dirToSheet(dirA)
  const odAt = (side: "a" | "b") => {
    const e = side === "a" ? a : b
    const od = side === "a" ? p.odA : p.odB
    const faceX = side === "a" ? 0 : D
    const weldX = side === "a" ? weldAx : weldBx
    const n = side === "a" ? dA : dB
    const hw = side === "a" ? hwA : hwB
    if (e.maxOd <= FLANGE_LIKE * od) {
      dims.push(
        linearDimension({
          id: side === "a" ? "od-a" : "od",
          a: S([faceX, od / 2]),
          b: S([faceX, -od / 2]),
          normal: n,
          offset: ROW1 + Math.max(0, hw - (od / 2) * s),
          clearA: 3,
          clearB: 3,
          label: `Ø${formatDim(od)}`,
        }),
      )
      return
    }
    const inward = side === "a" ? 1 : -1
    const dirs: Vec2[] = (
      [
        [inward * 0.5, -1],
        [inward * 1, -1],
        [inward * 0.2, -1],
        [inward * 0.5, 1],
        [inward * 1, 1],
      ] as Vec2[]
    ).map((d) => unit(d))
    const tips: Vec2[] = [S([weldX + inward * 0.02, od / 2]), S([weldX + inward * 0.02, -od / 2])]
    const cands = leaderCandidates(side === "a" ? "od-a" : "od", `Ø${formatDim(od)} ${p.odNoun ?? "TUBE"}`, tips, dirs, [40, 70, 110])
    dims.push(bestGraphic(cands, dims, ctx))
  }
  odAt("b")
  if (Math.abs(p.odA - p.odB) > 1e-9 || a.maxOd > FLANGE_LIKE * p.odA) odAt("a")

  if (p.wall) {
    const tubes = segs.filter((g) => g.style === "tube" && g.x1 - g.x0 > 1e-9)
    const tipXs: number[] = []
    for (const f of [0.75, 0.5, 0.25]) for (const g of tubes.slice().reverse()) tipXs.push(g.x1 - f * (g.x1 - g.x0))
    if (tipXs.length) {
      const g0 = tubes[tubes.length - 1]
      const wallY = -(g0.r0 - p.wall / 2)
      const down: Vec2 = [0, 1]
      const dirs = [1, 0.4, 2, 0, -0.4, -1, -2].map((k) => unit(add(down, dB, k)))
      const hwT = g0.r0 * s
      const cands = leaderCandidates(
        "wall",
        `${formatDim(p.wall)} WALL`,
        tipXs.map((x) => S([x, wallY])),
        dirs,
        [30 + hwT * 0.2, 60 + hwT * 0.2, 100, hwMax - hwT + 40],
      )
      dims.push(bestGraphic(cands, dims, ctx))
    }
  }

  return {
    frame,
    title,
    strip,
    tf,
    broken: disp.broken,
    outerPaths,
    innerPaths,
    bodyPaths,
    hosePaths,
    braidPaths,
    centerlines,
    faceLines,
    endOutlines,
    breakPaths,
    dims,
    endTags,
    notes,
    partOutline,
    reserved,
  }
}

/** Lays out an axial part view (fit to the sheet, broken view when long). */
export function layoutAxial(p: AxialPartInput, reserved: Box[] = []): AxialLayout {
  const disp = axialDisplay(p)
  return fitToSheet(displayExtents(p, disp), (tf) => buildAt(p, disp, tf, reserved))
}

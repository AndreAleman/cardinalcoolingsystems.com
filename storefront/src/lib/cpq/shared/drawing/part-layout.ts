// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Pure helpers shared by the part views (ported from Sanitube part-layout.ts): End Connection outlines,
// leader placement scoring, the reserved-area / frame checks, and the fit-to-sheet search.
// Same rules as Sanitube's sweep layout.
// No React, no DOM.

import type { BBox, EndGeom, Vec2 } from "../types"
import {
  DIM_STYLE,
  add,
  boxesOverlap,
  leader,
  polylineHitsBox,
  segmentHitsBox,
  segmentsIntersect,
  textBox,
  type Box,
  type DimGraphic,
  type DimText,
} from "./dimension-layout"
import { frameBox, stripBox, titleBox, type EndOutline } from "./layout"
import { polylineToPath, toSheet, type SheetTransform } from "./svg-path"

/** Px reserved around the part's model extents for dimensions on the first fit pass. */
export const DIM_MARGIN = 92
/** Offsets of the first and second rows of dimensions, beyond the part's half-width. */
export const ROW1 = 30
export const ROW2 = 64

export const leftNormal = (d: Vec2): Vec2 => [-d[1], d[0]]
export const neg = (d: Vec2): Vec2 => [-d[0], -d[1]]

/** Everything a part layout must expose for the fit search and the overlap checks. */
export type PartLayoutBase = {
  frame: Box
  title: Box
  strip: Box
  tf: SheetTransform
  /** Sheet polylines of the part (walls, faces, end outlines, break lines). */
  partOutline: Vec2[][]
  dims: DimGraphic[]
  endTags: DimText[]
  /** Extra areas to keep clear (e.g. the ENGINEERING REVIEW stamp). */
  reserved?: Box[]
}

export function sheetBoxes(): { frame: Box; title: Box; strip: Box } {
  return { frame: frameBox(), title: titleBox(), strip: stripBox() }
}

/**
 * Outline of an End Connection at a face (model `face`, outward unit `dir`), or a face line for a
 * plain weld end. `od` is the tube OD (the weld line spans it).
 */
export function endOutlineAt(
  face: Vec2,
  dir: Vec2,
  e: EndGeom,
  od: number,
  S: (p: Vec2) => Vec2,
): { outline: EndOutline; faceLine: null } | { outline: null; faceLine: [Vec2, Vec2] } {
  const n = leftNormal(dir)
  if (e.profile.length === 0 || e.length <= 0) {
    return { outline: null, faceLine: [S(add(face, n, od / 2)), S(add(face, n, -od / 2))] }
  }
  const top = e.profile.map(([ax, r]) => S(add(add(face, dir, -ax), n, r)))
  const bottom = e.profile
    .slice()
    .reverse()
    .map(([ax, r]) => S(add(add(face, dir, -ax), n, -r)))
  const poly = [...top, ...bottom]
  const back = add(face, dir, -e.length)
  const weld: [Vec2, Vec2] = [S(add(back, n, od / 2)), S(add(back, n, -od / 2))]
  return { outline: { d: polylineToPath(poly, true), poly, weld }, faceLine: null }
}

/**
 * Tags for a straight run's two ends ("A (TC)", "B (BW)") on one line below it (sheet `y`). Each tag
 * sits just inside its weld line (A left-aligned, B right-aligned), clear of extension lines that
 * drop from the faces. When the two would overlap (a short run), they move outside the faces.
 */
export function runEndTags(
  y: number,
  a: { faceX: number; weldX: number; text: string },
  b: { faceX: number; weldX: number; text: string },
): DimText[] {
  const make = (x: number, text: string, anchor: DimText["anchor"]): DimText => {
    const at: Vec2 = [x, y]
    return { at, text, anchor, box: textBox(at, text, DIM_STYLE.font, anchor) }
  }
  const inA = make(Math.max(a.faceX, a.weldX) + 4, a.text, "start")
  const inB = make(Math.min(b.faceX, b.weldX) - 4, b.text, "end")
  // Inside only when A stays left of B with a gap (overlapping ends put the weld lines in reverse).
  if (inA.box.x + inA.box.w + 6 <= inB.box.x) return [inA, inB]
  return [make(a.faceX - 8, a.text, "end"), make(b.faceX + 8, b.text, "start")]
}

/** True when two dimensions would be confused: a label on a label, or a line through a label. */
export function dimsConflict(x: DimGraphic, y: DimGraphic): boolean {
  for (const a of x.texts) for (const b of y.texts) if (boxesOverlap(a.box, b.box, 2)) return true
  for (const [p, q] of x.lines) for (const t of y.texts) if (segmentHitsBox(p, q, t.box)) return true
  for (const [p, q] of y.lines) for (const t of x.texts) if (segmentHitsBox(p, q, t.box)) return true
  return false
}

/**
 * Leader candidates for a note such as ".065 WALL": every tip × direction × run length, in order of
 * preference (bestGraphic keeps the first of equal scores).
 */
export function leaderCandidates(id: string, label: string, tips: Vec2[], dirs: Vec2[], runs: number[]): DimGraphic[] {
  const out: DimGraphic[] = []
  for (const run of runs) {
    for (const tip of tips) {
      for (const d of dirs) {
        const elbow = add(tip, d, run)
        out.push(leader({ id, tip, from: tip, elbow, label, arrowDir: [-d[0], -d[1]] }))
      }
    }
  }
  return out
}

/** Score of a candidate leader/label against the part, other dims, tags, reserved boxes and the frame. */
export function scoreGraphic(cand: DimGraphic, others: DimGraphic[], l: Omit<PartLayoutBase, "dims" | "tf">): number {
  const reserved = [l.title, l.strip, ...(l.reserved ?? [])]
  let score = 0
  for (const t of cand.texts) {
    for (const poly of l.partOutline) if (polylineHitsBox(poly, t.box)) score += 10
    for (const o of others) {
      for (const ot of o.texts) if (boxesOverlap(t.box, ot.box, 2)) score += 6
      for (const [p, q] of o.lines) if (segmentHitsBox(p, q, t.box)) score += 3
    }
    for (const et of l.endTags) if (boxesOverlap(t.box, et.box, 2)) score += 6
    for (const r of reserved) if (boxesOverlap(t.box, r, 4)) score += 20
    const f = l.frame
    if (t.box.x < f.x || t.box.y < f.y || t.box.x + t.box.w > f.x + f.w || t.box.y + t.box.h > f.y + f.h) score += 20
  }
  for (const [p, q] of cand.lines) {
    for (const o of others) for (const ot of o.texts) if (segmentHitsBox(p, q, ot.box)) score += 3
    for (const et of l.endTags) if (segmentHitsBox(p, q, et.box)) score += 3
    // Mildly prefer leaders that do not cross other dimension lines.
    for (const o of others) for (const [r, t] of o.lines) if (segmentsIntersect(p, q, r, t)) score += 2
  }
  return score
}

export function bestGraphic(cands: DimGraphic[], others: DimGraphic[], l: Omit<PartLayoutBase, "dims" | "tf">): DimGraphic {
  let pick = cands[0]
  let bestScore = Infinity
  for (const c of cands) {
    const sc = scoreGraphic(c, others, l)
    if (sc < bestScore) {
      bestScore = sc
      pick = c
    }
  }
  return pick
}

/** Every drawn item that must stay clear of the title block and the logo strip. */
export function hitsReserved(l: PartLayoutBase): boolean {
  for (const b of [l.title, l.strip, ...(l.reserved ?? [])]) {
    const padded: Box = { x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12 }
    for (const poly of l.partOutline) if (polylineHitsBox(poly, padded)) return true
    for (const d of l.dims) {
      for (const [p, q] of d.lines) if (segmentHitsBox(p, q, padded)) return true
      for (const t of d.texts) if (boxesOverlap(t.box, padded)) return true
    }
    for (const t of l.endTags) if (boxesOverlap(t.box, padded)) return true
  }
  return false
}

export function outsideFrame(l: PartLayoutBase): boolean {
  const f = l.frame
  const inside = (p: Vec2) => p[0] >= f.x && p[0] <= f.x + f.w && p[1] >= f.y && p[1] <= f.y + f.h
  for (const poly of l.partOutline) for (const p of poly) if (!inside(p)) return true
  for (const d of l.dims) {
    for (const [p, q] of d.lines) if (!inside(p) || !inside(q)) return true
    for (const a of d.arrows) for (const p of a) if (!inside(p)) return true
    for (const t of d.texts) if (!inside([t.box.x, t.box.y]) || !inside([t.box.x + t.box.w, t.box.y + t.box.h])) return true
  }
  for (const t of l.endTags) if (!inside([t.box.x, t.box.y]) || !inside([t.box.x + t.box.w, t.box.y + t.box.h])) return true
  return false
}

type Anchor = "center" | "tl" | "tr" | "bl" | "br"
/** Px around the part's model extents taken by dimensions/labels, per side. */
type Margins = { l: number; r: number; t: number; b: number }

function transformFor(e: BBox, s: number, m: Margins, area: Box, anchor: Anchor): SheetTransform {
  const cw = (e.maxX - e.minX) * s + m.l + m.r
  const ch = (e.maxY - e.minY) * s + m.t + m.b
  let left = area.x + (area.w - cw) / 2
  let top = area.y + (area.h - ch) / 2
  if (anchor === "tl" || anchor === "bl") left = area.x
  if (anchor === "tr" || anchor === "br") left = area.x + area.w - cw
  if (anchor === "tl" || anchor === "tr") top = area.y
  if (anchor === "bl" || anchor === "br") top = area.y + area.h - ch
  // sheet x = tx + s·x ; sheet y = ty − s·y
  return { scale: s, tx: left + m.l - s * e.minX, ty: top + m.t + s * e.maxY }
}

function fitScale(e: BBox, area: Box, m: Margins): number {
  const ew = Math.max(e.maxX - e.minX, 1e-6)
  const eh = Math.max(e.maxY - e.minY, 1e-6)
  return Math.max(0.01, Math.min((area.w - m.l - m.r) / ew, (area.h - m.t - m.b) / eh))
}

/** Px margins actually used around the model extents by everything drawn. */
function measureMargins(l: PartLayoutBase, e: BBox): Margins {
  const [x0, y0] = toSheet([e.minX, e.maxY], l.tf)
  const [x1, y1] = toSheet([e.maxX, e.minY], l.tf)
  let minX = x0
  let maxX = x1
  let minY = y0
  let maxY = y1
  const grow = (p: Vec2) => {
    if (p[0] < minX) minX = p[0]
    if (p[0] > maxX) maxX = p[0]
    if (p[1] < minY) minY = p[1]
    if (p[1] > maxY) maxY = p[1]
  }
  const growBox = (b: Box) => {
    grow([b.x, b.y])
    grow([b.x + b.w, b.y + b.h])
  }
  for (const d of l.dims) {
    for (const [p, q] of d.lines) {
      grow(p)
      grow(q)
    }
    for (const a of d.arrows) a.forEach(grow)
    for (const t of d.texts) growBox(t.box)
  }
  for (const t of l.endTags) growBox(t.box)
  for (const poly of l.partOutline) poly.forEach(grow)
  return { l: x0 - minX + 4, r: maxX - x1 + 4, t: y0 - minY + 4, b: maxY - y1 + 4 }
}

type Candidate = { area: Box; anchor: Anchor; scale: number; margins: Margins }

function idealFor<L extends PartLayoutBase>(e: BBox, build: (tf: SheetTransform) => L, area: Box, anchor: Anchor): Candidate {
  let m: Margins = { l: DIM_MARGIN, r: DIM_MARGIN, t: DIM_MARGIN, b: DIM_MARGIN }
  let s = fitScale(e, area, m)
  for (let i = 0; i < 3; i++) {
    const l = build(transformFor(e, s, m, area, anchor))
    const measured = measureMargins(l, e)
    m = {
      l: Math.max(measured.l, 8),
      r: Math.max(measured.r, 8),
      t: Math.max(measured.t, 8),
      b: Math.max(measured.b, 8),
    }
    s = fitScale(e, area, m)
  }
  return { area, anchor, scale: s, margins: m }
}

/**
 * Fits a part view to the sheet, as the sweep's layoutDrawing does: tries the full sheet (anchored
 * in each corner) and the two rectangles above / beside the title block, shrinks a candidate until
 * its part and dimensions stay clear of the title block and inside the frame, and keeps the
 * largest scale. `extents` = the model-space box the drawing is fitted around.
 */
export function fitToSheet<L extends PartLayoutBase>(extents: BBox, build: (tf: SheetTransform) => L): L {
  const { frame, title, strip } = sheetBoxes()
  const inner: Box = { x: frame.x + 8, y: frame.y + 8, w: frame.w - 16, h: frame.h - 16 }
  const above: Box = { x: inner.x, y: inner.y, w: inner.w, h: strip.y - 8 - inner.y }
  const beside: Box = { x: inner.x, y: inner.y, w: title.x - 10 - inner.x, h: inner.h }

  const cands: Candidate[] = [
    ...(["br", "tl", "bl", "tr", "center"] as const).map((a) => idealFor(extents, build, inner, a)),
    idealFor(extents, build, above, "center"),
    idealFor(extents, build, beside, "center"),
  ].sort((p, q) => q.scale - p.scale)

  let best: L | null = null
  let last: L | null = null
  for (const c of cands) {
    if (best && best.tf.scale >= c.scale) break
    let s = c.scale
    for (let k = 0; k < 10; k++, s *= 0.92) {
      if (best && best.tf.scale >= s) break
      const l = build(transformFor(extents, s, c.margins, c.area, c.anchor))
      last = l
      if (!hitsReserved(l) && !outsideFrame(l)) {
        best = l
        break
      }
    }
  }
  return best ?? last ?? build(transformFor(extents, cands[0].scale, cands[0].margins, cands[0].area, cands[0].anchor))
}

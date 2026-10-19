// Pure dimension primitives for the Engineering View, in sheet space (px, Y down).
// Each primitive returns a DimGraphic (lines, arcs, arrowheads, texts) that dimension.tsx draws
// as-is, and that layout.ts / tests use for overlap checks. Text is unidirectional (always
// horizontal), per ASME Y14.5 drawing practice.

import type { Vec2 } from "../types"
import { n2 } from "./svg-path"

export const DIM_STYLE = {
  font: 15,
  /** Average glyph width as a fraction of the font size (Arial-like). */
  charW: 0.62,
  arrowLen: 10,
  arrowHalf: 3.2,
  /** Extension line overshoot past the dimension line. */
  extOver: 6,
  /** Gap between the dimension line and its text. */
  textPad: 5,
} as const

export type Box = { x: number; y: number; w: number; h: number }
export type DimText = { at: Vec2; text: string; box: Box; anchor: "start" | "middle" | "end" }
export type DimGraphic = {
  id: string
  lines: [Vec2, Vec2][]
  arcs: string[]
  arrows: [Vec2, Vec2, Vec2][]
  texts: DimText[]
}

// ---------- vector helpers ----------
export const add = (a: Vec2, b: Vec2, k = 1): Vec2 => [a[0] + b[0] * k, a[1] + b[1] * k]
export const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]]
export const len = (a: Vec2): number => Math.hypot(a[0], a[1])
export const unit = (a: Vec2): Vec2 => {
  const l = len(a)
  return l < 1e-12 ? [0, 0] : [a[0] / l, a[1] / l]
}
export const mid = (a: Vec2, b: Vec2): Vec2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

// ---------- text metrics ----------
export function textWidth(text: string, font: number = DIM_STYLE.font): number {
  return text.length * font * DIM_STYLE.charW
}

/** Box of a horizontal label centred on `at` (anchor middle, baseline handled by the renderer). */
export function textBox(at: Vec2, text: string, font: number = DIM_STYLE.font, anchor: DimText["anchor"] = "middle"): Box {
  const w = textWidth(text, font) + 4
  const h = font + 2
  const x = anchor === "middle" ? at[0] - w / 2 : anchor === "start" ? at[0] - 2 : at[0] - w + 2
  return { x, y: at[1] - h / 2, w, h }
}

function makeText(at: Vec2, text: string, anchor: DimText["anchor"] = "middle"): DimText {
  return { at, text, anchor, box: textBox(at, text, DIM_STYLE.font, anchor) }
}

/** Extent of a label's box along direction u (for breaking a dimension line around it). */
function extentAlong(text: string, u: Vec2): number {
  const w = textWidth(text) + 4
  const h = DIM_STYLE.font + 2
  return Math.abs(u[0]) * w + Math.abs(u[1]) * h
}

/** Filled arrowhead with its tip at `tip`, pointing along unit `dir`. */
export function arrowHead(tip: Vec2, dir: Vec2): [Vec2, Vec2, Vec2] {
  const back = add(tip, dir, -DIM_STYLE.arrowLen)
  const n: Vec2 = [-dir[1], dir[0]]
  return [tip, add(back, n, DIM_STYLE.arrowHalf), add(back, n, -DIM_STYLE.arrowHalf)]
}

// ---------- linear dimension ----------
export type LinearDimInput = {
  id: string
  /** Measured points (sheet). The dimension is parallel to a→b. */
  a: Vec2
  b: Vec2
  /** Unit offset direction (sheet), perpendicular to a→b. */
  normal: Vec2
  /** Distance from a/b to the dimension line, px. */
  offset: number
  /** Where each extension line starts, measured from a/b along `normal`, px. */
  clearA: number
  clearB: number
  label: string
}

export function linearDimension(d: LinearDimInput): DimGraphic {
  const { arrowLen, extOver, textPad } = DIM_STYLE
  const A = add(d.a, d.normal, d.offset)
  const B = add(d.b, d.normal, d.offset)
  const lines: [Vec2, Vec2][] = []
  if (d.offset - d.clearA > 1) lines.push([add(d.a, d.normal, d.clearA), add(A, d.normal, extOver)])
  if (d.offset - d.clearB > 1) lines.push([add(d.b, d.normal, d.clearB), add(B, d.normal, extOver)])

  const u = unit(sub(B, A))
  const L = len(sub(B, A))
  const ext = extentAlong(d.label, u) + 2 * textPad
  const arrows: [Vec2, Vec2, Vec2][] = []
  const texts: DimText[] = []

  if (L >= 2 * arrowLen + ext + 4) {
    // Arrows inside, text centred in a break in the line.
    const m = mid(A, B)
    lines.push([A, add(m, u, -ext / 2)], [add(m, u, ext / 2), B])
    arrows.push(arrowHead(A, [-u[0], -u[1]]), arrowHead(B, u))
    texts.push(makeText(m, d.label))
  } else if (L >= 2 * arrowLen + 2) {
    // Arrows inside, text beyond B on a short run-out.
    const tc = add(B, u, ext / 2 + 4)
    lines.push([A, B], [B, add(B, u, 4)])
    arrows.push(arrowHead(A, [-u[0], -u[1]]), arrowHead(B, u))
    texts.push(makeText(tc, d.label))
  } else {
    // Too short: arrows outside pointing in, text beyond B.
    const runA = add(A, u, -(arrowLen + 8))
    const runB = add(B, u, arrowLen + 4)
    lines.push([runA, runB])
    arrows.push(arrowHead(A, u), arrowHead(B, [-u[0], -u[1]]))
    texts.push(makeText(add(runB, u, ext / 2), d.label))
  }
  return { id: d.id, lines, arcs: [], arrows, texts }
}

// ---------- angular dimension ----------
export type AngularDimInput = {
  id: string
  center: Vec2
  radius: number
  /** Sheet-space angles (radians, measured with Y down, i.e. atan2(dy, dx) in sheet). */
  from: number
  to: number
  label: string
  /** Radius at which the label is centred. */
  labelRadius: number
}

const polar = (c: Vec2, r: number, a: number): Vec2 => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]

export function angularDimension(d: AngularDimInput): DimGraphic {
  const { arrowLen } = DIM_STYLE
  const span = d.to - d.from
  const p0 = polar(d.center, d.radius, d.from)
  const p1 = polar(d.center, d.radius, d.to)
  // Sheet Y is down, so increasing angle is visually clockwise = SVG sweep-flag 1.
  const sweep = span > 0 ? 1 : 0
  const large = Math.abs(span) > Math.PI ? 1 : 0
  const arcs: string[] = []
  if (Math.abs(span) >= Math.PI - 1e-6) {
    const m = polar(d.center, d.radius, d.from + span / 2)
    arcs.push(
      `M${n2(p0[0])} ${n2(p0[1])} A${n2(d.radius)} ${n2(d.radius)} 0 0 ${sweep} ${n2(m[0])} ${n2(m[1])} A${n2(d.radius)} ${n2(d.radius)} 0 0 ${sweep} ${n2(p1[0])} ${n2(p1[1])}`
    )
  } else {
    arcs.push(`M${n2(p0[0])} ${n2(p0[1])} A${n2(d.radius)} ${n2(d.radius)} 0 ${large} ${sweep} ${n2(p1[0])} ${n2(p1[1])}`)
  }
  const arrows: [Vec2, Vec2, Vec2][] = []
  if (Math.abs(span) * d.radius >= 2 * arrowLen + 6) {
    const s = Math.sign(span)
    // Tangent at angle a in the direction of increasing angle: (−sin a, cos a).
    const t0: Vec2 = [Math.sin(d.from) * s, -Math.cos(d.from) * s]
    const t1: Vec2 = [-Math.sin(d.to) * s, Math.cos(d.to) * s]
    arrows.push(arrowHead(p0, t0), arrowHead(p1, t1))
  }
  const lm = polar(d.center, d.labelRadius, d.from + span / 2)
  return { id: d.id, lines: [], arcs, arrows, texts: [makeText(lm, d.label)] }
}

// ---------- leader (radius / note) ----------
export type LeaderInput = {
  id: string
  /** Arrow tip (on the feature). */
  tip: Vec2
  /** Leader runs from `from` (inclusive, may equal tip) through the tip to `elbow`. */
  from: Vec2
  elbow: Vec2
  label: string
  /** Arrow points along this unit direction at the tip. */
  arrowDir: Vec2
}

export function leader(d: LeaderInput): DimGraphic {
  const right = d.elbow[0] >= d.tip[0] - 1e-6
  const landing = add(d.elbow, [right ? 1 : -1, 0], 10)
  const at = add(landing, [right ? 3 : -3, 0])
  return {
    id: d.id,
    lines: [
      [d.from, d.elbow],
      [d.elbow, landing],
    ],
    arcs: [],
    arrows: [arrowHead(d.tip, d.arrowDir)],
    texts: [makeText(at, d.label, right ? "start" : "end")],
  }
}

// ---------- collision ----------
export function boxesOverlap(a: Box, b: Box, pad = 0): boolean {
  return a.x - pad < b.x + b.w && b.x - pad < a.x + a.w && a.y - pad < b.y + b.h && b.y - pad < a.y + a.h
}

function orient(a: Vec2, b: Vec2, c: Vec2): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

export function segmentsIntersect(p1: Vec2, p2: Vec2, q1: Vec2, q2: Vec2): boolean {
  const d1 = orient(q1, q2, p1)
  const d2 = orient(q1, q2, p2)
  const d3 = orient(p1, p2, q1)
  const d4 = orient(p1, p2, q2)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

function inBox(p: Vec2, b: Box): boolean {
  return p[0] >= b.x && p[0] <= b.x + b.w && p[1] >= b.y && p[1] <= b.y + b.h
}

export function segmentHitsBox(p: Vec2, q: Vec2, b: Box): boolean {
  if (inBox(p, b) || inBox(q, b)) return true
  const c: Vec2[] = [
    [b.x, b.y],
    [b.x + b.w, b.y],
    [b.x + b.w, b.y + b.h],
    [b.x, b.y + b.h],
  ]
  for (let i = 0; i < 4; i++) if (segmentsIntersect(p, q, c[i], c[(i + 1) % 4])) return true
  return false
}

export function polylineHitsBox(pts: Vec2[], b: Box): boolean {
  for (let i = 0; i + 1 < pts.length; i++) if (segmentHitsBox(pts[i], pts[i + 1], b)) return true
  return false
}

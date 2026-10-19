// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Pure helpers that turn shared-core geometry (inches, Y up) into SVG sheet coordinates
// (px, Y down). No React, no DOM. Ported unchanged from Sanitube.

import type { Segment, Vec2 } from "../types"

/** Model (in, Y up) → sheet (px, Y down): sheet = (tx + s·x, ty − s·y). */
export type SheetTransform = { scale: number; tx: number; ty: number }

export const IDENTITY_FLIP: SheetTransform = { scale: 1, tx: 0, ty: 0 }

export function toSheet(p: Vec2, tf: SheetTransform): Vec2 {
  return [tf.tx + tf.scale * p[0], tf.ty - tf.scale * p[1]]
}

/** A model direction (unit vector) expressed in sheet space (Y flipped, not scaled). */
export function dirToSheet(d: Vec2): Vec2 {
  return [d[0], -d[1]]
}

/** Compact number for path strings: 2 decimals, no "-0". */
export function n2(n: number): string {
  const r = Math.round(n * 100) / 100
  return Object.is(r, -0) || r === 0 ? "0" : String(r)
}

const EPS = 1e-6

function samePoint(a: Vec2, b: Vec2): boolean {
  return Math.abs(a[0] - b[0]) < 1e-4 && Math.abs(a[1] - b[1]) < 1e-4
}

function arcAt(s: Extract<Segment, { kind: "arc" }>, a: number): Vec2 {
  return [s.center[0] + s.radius * Math.cos(a), s.center[1] + s.radius * Math.sin(a)]
}

function segStart(s: Segment): Vec2 {
  return s.kind === "line" ? s.from : arcAt(s, s.startRad)
}

/**
 * SVG "A" command(s) for a model arc. Model `clockwise` (Y up) stays visually clockwise after
 * the Y flip, which is SVG sweep-flag 1. Arcs of ≥ 180° are split in halves so the endpoints
 * are never diametrically ambiguous; every emitted piece is < 180°, so large-arc is always 0.
 */
function arcCommands(s: Extract<Segment, { kind: "arc" }>, tf: SheetTransform): string[] {
  const span = Math.abs(s.endRad - s.startRad)
  if (span < EPS) return []
  if (span >= Math.PI - EPS) {
    const mid = (s.startRad + s.endRad) / 2
    return [
      ...arcCommands({ ...s, endRad: mid }, tf),
      ...arcCommands({ ...s, startRad: mid }, tf),
    ]
  }
  const r = s.radius * tf.scale
  const end = toSheet(arcAt(s, s.endRad), tf)
  const largeArc = span > Math.PI ? 1 : 0
  const sweep = s.clockwise ? 1 : 0
  return [`A${n2(r)} ${n2(r)} 0 ${largeArc} ${sweep} ${n2(end[0])} ${n2(end[1])}`]
}

/**
 * Path data for a chain of segments in model space. Consecutive segments that share an
 * endpoint continue the same subpath; a gap starts a new "M".
 */
export function segmentsToPath(segments: Segment[], tf: SheetTransform = IDENTITY_FLIP): string {
  const out: string[] = []
  let cursor: Vec2 | null = null
  for (const s of segments) {
    const start = segStart(s)
    if (!cursor || !samePoint(cursor, start)) {
      const p = toSheet(start, tf)
      out.push(`M${n2(p[0])} ${n2(p[1])}`)
    }
    if (s.kind === "line") {
      const p = toSheet(s.to, tf)
      out.push(`L${n2(p[0])} ${n2(p[1])}`)
      cursor = s.to
    } else {
      out.push(...arcCommands(s, tf))
      cursor = arcAt(s, s.endRad)
    }
  }
  return out.join(" ")
}

/** Sheet-space polyline approximation of segments (for collision checks). */
export function segmentsToPolyline(segments: Segment[], tf: SheetTransform, arcStepRad = Math.PI / 36): Vec2[] {
  const pts: Vec2[] = []
  for (const s of segments) {
    if (s.kind === "line") {
      pts.push(toSheet(s.from, tf), toSheet(s.to, tf))
    } else {
      const span = s.endRad - s.startRad
      const n = Math.max(2, Math.ceil(Math.abs(span) / arcStepRad))
      for (let i = 0; i <= n; i++) pts.push(toSheet(arcAt(s, s.startRad + (span * i) / n), tf))
    }
  }
  return pts
}

/** "M x y L x y …" for an open or closed sheet-space polyline. */
export function polylineToPath(points: Vec2[], closed = false): string {
  if (points.length === 0) return ""
  const body = points.map((p, i) => `${i === 0 ? "M" : "L"}${n2(p[0])} ${n2(p[1])}`).join(" ")
  return closed ? `${body} Z` : body
}

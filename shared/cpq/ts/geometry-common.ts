// Geometry helpers shared by every builder (ported from Sanitube spool-geometry.ts, plus the axial
// segment maths). Inches, XY plane, Y up.

import { endConnectionRow } from "./tables"
import type { AxialSegment, BBox, EndConnectionCode, EndGeom, FaceGeom, SizeCode, Vec2 } from "./types"

/** End Connection geometry from the table row. */
export function endGeomFor(code: EndConnectionCode, sizeCode: SizeCode): EndGeom {
  const row = endConnectionRow(code, sizeCode)
  return {
    code,
    sizeCode,
    length: row.length_in,
    maxOd: row.max_od_in,
    profile: row.profile.map((p) => [p[0], p[1]] as Vec2),
    bore: row.bore_in,
    massLb: row.mass_lb,
  }
}

/** Bounding box of a point set. */
export function bboxOf(pts: readonly Vec2[]): BBox {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    if (p[0] < minX) minX = p[0]
    if (p[1] < minY) minY = p[1]
    if (p[0] > maxX) maxX = p[0]
    if (p[1] > maxY) maxY = p[1]
  }
  return { minX, minY, maxX, maxY }
}

/** The four corners of an End Connection envelope (maxOd/2 either side, `length` back from the face). */
export function endEnvelope(face: Vec2, dir: Vec2, e: EndGeom): Vec2[] {
  const m = e.maxOd / 2
  const n: Vec2 = [-dir[1], dir[0]]
  const back: Vec2 = [face[0] - dir[0] * e.length, face[1] - dir[1] * e.length]
  return [
    [face[0] + n[0] * m, face[1] + n[1] * m],
    [face[0] - n[0] * m, face[1] - n[1] * m],
    [back[0] + n[0] * m, back[1] + n[1] * m],
    [back[0] - n[0] * m, back[1] - n[1] * m],
  ]
}

export function faceGeom(point: Vec2, dir: Vec2, end: EndGeom): FaceGeom {
  return { point, dir, end }
}

/** Volume of the wall of an axial segment (outer frustum − inner frustum), in³. */
export function segmentWallVolume(s: AxialSegment): number {
  const h = s.x1 - s.x0
  if (h <= 0) return 0
  const fr = (a: number, b: number) => (Math.PI / 3) * h * (a * a + a * b + b * b)
  const inner = s.ri0 === null || s.ri1 === null ? 0 : fr(s.ri0, s.ri1)
  return Math.max(0, fr(s.r0, s.r1) - inner)
}

/** Model extents of an axial part: faces at 0 and L, segments, end envelopes. */
export function axialBBox(L: number, a: EndGeom, b: EndGeom, segments: AxialSegment[], odA: number, odB: number): BBox {
  const pts: Vec2[] = [
    [0, odA / 2],
    [0, -odA / 2],
    [L, odB / 2],
    [L, -odB / 2],
    ...endEnvelope([0, 0], [-1, 0], a),
    ...endEnvelope([L, 0], [1, 0], b),
  ]
  for (const s of segments) pts.push([s.x0, s.r0], [s.x0, -s.r0], [s.x1, s.r1], [s.x1, -s.r1])
  return bboxOf(pts)
}

/** Rounds to 6 decimals (stable fixture values). */
export function r6(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

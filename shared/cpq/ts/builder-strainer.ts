// Strainer builder (spec Page 4): a 316L inline TC strainer plus the clamps and gaskets to install
// it, optional isolation valves either side and differential-pressure ports. No strainer is stocked
// today, so the strainer line never resolves and the page is Quote (B1) until one is.
//
// Geometry (approximate envelope, assemblies.json "strainer"): axis along +X, Face A (0,0), Face B
// (L,0); TC ends, a short tube neck, 45° cones up to the body OD, the body.

import { ASSEMBLIES, alloyOf, clampMassLb, endConnectionRow, tubeDims, valveRow } from "./tables"
import { axialBBox, endGeomFor, r6, segmentWallVolume } from "./geometry-common"
import { line, roleLabel, sizeLabel } from "./bom-lines"
import { makeBuilder } from "./builder-def"
import { STRAINER_KEYS } from "./option-keys"
import { strainerPartNumber } from "./part-number"
import { strainerSpecBlock } from "./spec-block"
import { okRange } from "./standard-range"
import type { AxialSegment, Bom, BomLine, StrainerGeometry, StrainerOptions, Weight } from "./types"

const NECK_IN = 0.75
const BODY_ALLOY = "t316l" as const

export function strainerBodyDims(size: number, body: StrainerOptions["body"]): { bodyOd: number; bodyLength: number } {
  const s = ASSEMBLIES.strainer
  const od = tubeDims(size).od
  const bodyOd = Math.max(s.body_od_factor * od, od + s.body_od_min_extra_in)
  const short = Math.max(s.short_length_min_in, s.short_length_factor * od)
  return { bodyOd, bodyLength: body === "long" ? short * s.long_length_factor : short }
}

export function meshMicron(mesh: StrainerOptions["mesh"]): number {
  const row = ASSEMBLIES.strainer.mesh.find((m) => String(m.mesh) === mesh)
  if (!row) throw new Error(`Unknown mesh ${mesh}`)
  return row.micron
}

export function strainerGeometry(o: StrainerOptions): StrainerGeometry {
  const t = tubeDims(o.size)
  const a = endGeomFor("tc", o.size)
  const b = endGeomFor("tc", o.size)
  const { bodyOd, bodyLength } = strainerBodyDims(o.size, o.body)
  const bodyWall = Math.max(t.wall, 0.083)
  const cone = (bodyOd - t.od) / 2
  const L = a.length + NECK_IN + bodyLength + NECK_IN + b.length
  const x0 = a.length
  const x1 = x0 + NECK_IN
  const x2 = x1 + cone
  const x3 = x1 + bodyLength - cone
  const x4 = x1 + bodyLength
  const x5 = x4 + NECK_IN
  const R = bodyOd / 2
  const Ri = R - bodyWall
  const segments: AxialSegment[] = [
    { x0, x1, r0: t.od / 2, r1: t.od / 2, ri0: t.id / 2, ri1: t.id / 2, style: "tube" },
    { x0: x1, x1: x2, r0: t.od / 2, r1: R, ri0: t.id / 2, ri1: Ri, style: "cone" },
    { x0: x2, x1: x3, r0: R, r1: R, ri0: Ri, ri1: Ri, style: "body" },
    { x0: x3, x1: x4, r0: R, r1: t.od / 2, ri0: Ri, ri1: t.id / 2, style: "cone" },
    { x0: x4, x1: x5, r0: t.od / 2, r1: t.od / 2, ri0: t.id / 2, ri1: t.id / 2, style: "tube" },
  ]
  const density = alloyOf(BODY_ALLOY).density_lb_per_in3
  const shellLb = segments.reduce((s, x) => s + segmentWallVolume(x), 0) * density
  const screenLb = Math.PI * (bodyOd - 2 * bodyWall) * (x3 - x2) * ASSEMBLIES.strainer.screen_mass_lb_per_in2
  return {
    kind: "strainer",
    od: t.od,
    wall: t.wall,
    bodyOd,
    bodyLength,
    overallLength: L,
    ends: { a, b },
    faces: { a: { point: [0, 0], dir: [-1, 0], end: a }, b: { point: [L, 0], dir: [1, 0], end: b } },
    segments,
    meshMicron: meshMicron(o.mesh),
    bbox: axialBBox(L, a, b, segments, t.od, t.od),
    approxWeightLb: shellLb + screenLb + a.massLb + b.massLb,
  }
}

export function strainerExpected(o: StrainerOptions): Record<string, unknown> {
  const g = strainerGeometry(o)
  return {
    overallLength: r6(g.overallLength),
    bodyOd: r6(g.bodyOd),
    bodyLength: r6(g.bodyLength),
    bbox: { minX: r6(g.bbox.minX), minY: r6(g.bbox.minY), maxX: r6(g.bbox.maxX), maxY: r6(g.bbox.maxY) },
  }
}

/** Two DP ports: each a TC ferrule, a TC cap (≈ a ferrule's mass) and a clamp. */
function dpPortsLb(): number {
  const p = ASSEMBLIES.strainer.dp_port_size_code
  const ferrule = endConnectionRow("tc", p).mass_lb
  return 2 * (ferrule + ferrule + clampMassLb(p))
}

export function strainerWeight(o: StrainerOptions): Weight {
  const g = strainerGeometry(o)
  const parts = [{ label: "Strainer body, screen and TC ends", lb: g.approxWeightLb }]
  const joints = o.iso === "1" ? 4 : 2
  parts.push({
    label: "Clamps and gaskets",
    lb: joints * (clampMassLb(o.size) + ASSEMBLIES.components.gasket_mass_lb),
  })
  if (o.iso === "1") parts.push({ label: "Isolation ball valves", lb: 2 * (valveRow("bv", o.size)?.mass_lb ?? 0) })
  if (o.dp === "1") parts.push({ label: "DP ports and caps", lb: dpPortsLb() })
  return { per_unit_lb: parts.reduce((s, p) => s + p.lb, 0), parts }
}

/** The strainer itself as one BOM line (used here and by the CDU kit). */
export function strainerLine(o: StrainerOptions, qty = 1): BomLine {
  const body = strainerPartNumber({ ...o, iso: "0" })
  return line({
    role: "strainer",
    label: `${roleLabel("strainer")}, ${sizeLabel(o.size)}, ${o.body} body, ${o.mesh} mesh (${meshMicron(o.mesh)} µm)${
      o.dp === "1" ? ", DP ports" : ""
    }`,
    qty,
    kind: "sku",
    vars: { d: "6", s: o.size },
    part_number: body,
    size_code: o.size,
  })
}

export function strainerBom(o: StrainerOptions): Bom {
  const s = o.size
  const lines: BomLine[] = [strainerLine(o)]
  const joints = o.iso === "1" ? 4 : 2
  lines.push(line({ role: "clamp", label: `${roleLabel("clamp")}, ${sizeLabel(s)}`, qty: joints, vars: { s }, size_code: s }))
  lines.push(line({ role: "gasket_epdm", label: `${roleLabel("gasket_epdm")}, ${sizeLabel(s)}`, qty: joints, vars: { s }, size_code: s }))
  if (o.iso === "1") {
    lines.push(line({ role: "valve_bv", label: `${roleLabel("valve_bv")}, ${sizeLabel(s)} (isolation, either side)`, qty: 2, vars: { s }, size_code: s }))
  }
  if (o.dp === "1") {
    const p = ASSEMBLIES.strainer.dp_port_size_code
    lines.push(line({ role: "cap_tc", label: `${roleLabel("cap_tc")}, ${sizeLabel(p)} (DP port)`, qty: 2, vars: { d: "6", s: p }, size_code: p }))
    lines.push(line({ role: "clamp", label: `${roleLabel("clamp")}, ${sizeLabel(p)} (DP port)`, qty: 2, vars: { s: p }, size_code: p }))
    lines.push(line({ role: "gasket_epdm", label: `${roleLabel("gasket_epdm")}, ${sizeLabel(p)} (DP port)`, qty: 2, vars: { s: p }, size_code: p }))
  }
  return { lines, units: o.qty }
}

export function describeStrainer(o: StrainerOptions): string {
  const extras = [o.iso === "1" ? "ISOLATION VALVES" : "", o.dp === "1" ? "DP PORTS" : ""].filter((x) => x)
  return `${sizeLabel(o.size)} TC INLINE STRAINER ${o.body.toUpperCase()} BODY ${o.mesh} MESH T316L${extras.length ? ", " + extras.join(", ") : ""}`
}

export function strainerDisplay(o: StrainerOptions) {
  return [
    { label: "Size", value: sizeLabel(o.size) },
    { label: "Body", value: o.body === "long" ? "Long" : "Short" },
    { label: "Mesh", value: `${o.mesh} mesh (${meshMicron(o.mesh)} µm)` },
    { label: "Isolation valves", value: o.iso === "1" ? "Ball valve either side" : "None" },
    { label: "DP ports", value: o.dp === "1" ? `2 × ${sizeLabel(ASSEMBLIES.strainer.dp_port_size_code)} TC` : "None" },
    { label: "Quantity", value: String(o.qty) },
  ]
}

export const STRAINER_BUILDER = makeBuilder<StrainerOptions, StrainerGeometry>({
  type: "strainer",
  path: "/build/strainer",
  title: "Strainer",
  keys: STRAINER_KEYS,
  hasStep: false,
  partNumber: strainerPartNumber,
  describe: describeStrainer,
  display: strainerDisplay,
  geometry: strainerGeometry,
  expected: strainerExpected,
  weight: strainerWeight,
  bom: strainerBom,
  standardRange: () => okRange(),
  specBlock: (o) => strainerSpecBlock(o, strainerBom(o)),
})

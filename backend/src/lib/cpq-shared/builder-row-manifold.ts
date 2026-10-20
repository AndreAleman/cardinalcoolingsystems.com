// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Row Manifold builder (spec Page 2): a header with drops at a pitch, built to the OCP TCS row
// manifold guideline. Always Quote (welded).
//
// Geometry: header along +X, Face A (0,0) facing −X, Face B (L,0) facing +X, drops toward +Y.
//   L (face to face) = (drops − 1) × pitch + 2 × end allowance   (assemblies.json manifold.rows)
//   drop i centerline x = end allowance + i × pitch; drop face at y = drop height (header CL → face)
//   fill (1" TC) on the bottom and instrument ports on top in the End A allowance; drain (bottom)
//   and air vent (top) in the End B allowance, each centred between the end's weld line and the
//   nearest drop.
// `ends` sets both header ends; `cap` = TC inlet at End A and a welded cap at End B.

import { formatDim, formatInches } from "./units"
import { ASSEMBLIES, alloyOf, endConnectionType, tubeDims, tubeMassLb, valveRow } from "./tables"
import { bboxOf, endEnvelope, endGeomFor, r6 } from "./geometry-common"
import { line, leadTimeOf, roleLabel, sizeLabel } from "./bom-lines"
import { makeBuilder } from "./builder-def"
import { ROW_MANIFOLD_KEYS } from "./option-keys"
import { manifoldEndCodes, manifoldPartNumber } from "./part-number"
import { manifoldSpecBlock } from "./spec-block"
import { checkManifoldRange } from "./standard-range"
import type {
  Bom,
  BomLine,
  EndConnectionCode,
  ManifoldBranch,
  ManifoldGeometry,
  ManifoldPortRole,
  RowManifoldOptions,
  SizeCode,
  Vec2,
  Weight,
} from "./types"

export function manifoldRow(header: SizeCode) {
  const r = ASSEMBLIES.manifold.rows.find((x) => x.header_code === header)
  if (!r) throw new Error(`No manifold row for header ${header}`)
  return r
}

/** Header face-to-face length: (drops − 1) × pitch + 2 × end allowance. */
export function manifoldHeaderLength(o: Pick<RowManifoldOptions, "header" | "drops" | "pitch">): number {
  return (o.drops - 1) * o.pitch + 2 * manifoldRow(o.header).end_allowance_in
}

const DROP_END: Record<RowManifoldOptions["dstyle"], EndConnectionCode> = { tc: "tc", bv: "tc", uqd: "bw" }

function branch(
  role: ManifoldPortRole,
  x: number,
  side: 1 | -1,
  size: SizeCode,
  code: EndConnectionCode,
  height: number,
  headerOd: number,
  valve: ManifoldBranch["valve"] = null,
): ManifoldBranch {
  const t = tubeDims(size)
  const end = endGeomFor(code, size)
  const point: Vec2 = [x, side * height]
  return {
    role,
    x,
    side,
    sizeCode: size,
    od: t.od,
    wall: t.wall,
    height,
    stubLength: height - headerOd / 2 - end.length,
    end,
    face: { point, dir: [0, side], end },
    valve,
  }
}

export function manifoldGeometry(o: RowManifoldOptions): ManifoldGeometry {
  const m = ASSEMBLIES.manifold
  const row = manifoldRow(o.header)
  const H = tubeDims(o.header)
  const [codeA, codeB] = manifoldEndCodes(o.ends)
  const a = endGeomFor(codeA, o.header)
  const b = endGeomFor(codeB, o.header)
  const allowance = row.end_allowance_in
  const L = manifoldHeaderLength(o)
  const portH = H.od / 2 + m.port_projection_in

  const branches: ManifoldBranch[] = []
  const valve = o.dstyle === "bv" ? valveRow("bv", o.drop) : null
  for (let i = 0; i < o.drops; i++) {
    branches.push(
      branch("drop", allowance + i * o.pitch, 1, o.drop, DROP_END[o.dstyle], row.drop_height_in, H.od, valve ? { length: valve.length_in, massLb: valve.mass_lb } : null),
    )
  }
  // Port positions: centred in the span between the end's weld line and the first drop's envelope.
  const dropR = Math.max(tubeDims(o.drop).od, endGeomFor(DROP_END[o.dstyle], o.drop).maxOd) / 2
  const spanA: [number, number] = [a.length, allowance - dropR]
  const spanB: [number, number] = [L - allowance + dropR, L - b.length]
  const midA = (spanA[0] + spanA[1]) / 2
  const midB = (spanB[0] + spanB[1]) / 2
  if (o.fill === "1") {
    branches.push(branch("fill", midA, -1, m.fill_size_code, "tc", portH, H.od))
    branches.push(branch("drain", midB, -1, m.drain_size_code, "tc", portH, H.od))
    branches.push(branch("vent", midB, 1, m.vent_size_code, "tc", portH, H.od))
  }
  if (o.inst === "1") {
    const n = m.instrument_ports
    for (let k = 0; k < n; k++) {
      const x = spanA[0] + ((k + 1) * (spanA[1] - spanA[0])) / (n + 1)
      branches.push(branch("instrument", x, 1, m.instrument_size_code, "tc", portH, H.od))
    }
  }

  const tubeLength = L - a.length - b.length
  const pts: Vec2[] = [
    [0, H.od / 2],
    [0, -H.od / 2],
    [L, H.od / 2],
    [L, -H.od / 2],
    ...endEnvelope([0, 0], [-1, 0], a),
    ...endEnvelope([L, 0], [1, 0], b),
  ]
  for (const br of branches) {
    pts.push(...endEnvelope(br.face.point, br.face.dir, br.end))
    if (br.valve) pts.push([br.x, br.side * (br.height + br.valve.length)])
  }

  const density = alloyOf(o.alloy).density_lb_per_in3
  let weight = tubeMassLb(o.header, tubeLength, density) + a.massLb + b.massLb
  for (const br of branches) {
    weight += tubeMassLb(br.sizeCode, br.stubLength, density) + br.end.massLb + (br.valve ? br.valve.massLb : 0)
  }
  const drops = branches.filter((x) => x.role === "drop")

  return {
    kind: "row-manifold",
    header: {
      sizeCode: o.header,
      od: H.od,
      wall: H.wall,
      id: H.id,
      length: L,
      endAllowance: allowance,
      ends: { a, b },
      faces: { a: { point: [0, 0], dir: [-1, 0], end: a }, b: { point: [L, 0], dir: [1, 0], end: b } },
      tubeLength,
    },
    pitch: o.pitch,
    dropHeight: row.drop_height_in,
    branches,
    cutList: {
      header_tube_in: tubeLength,
      drop_stub_in: drops.length ? drops[0].stubLength : 0,
      drops: drops.length,
      port_stubs: branches
        .filter((x) => x.role !== "drop")
        .map((x) => ({ role: x.role, size_code: x.sizeCode, length_in: x.stubLength })),
      header_sticks: Math.max(1, Math.ceil(tubeLength / ASSEMBLIES.stick_length_in - 1e-9)),
    },
    bbox: bboxOf(pts),
    approxWeightLb: weight,
  }
}

export function manifoldExpected(o: RowManifoldOptions): Record<string, unknown> {
  const g = manifoldGeometry(o)
  const drops = g.branches.filter((b) => b.role === "drop")
  return {
    headerLength: r6(g.header.length),
    headerTubeLength: r6(g.header.tubeLength),
    faces: {
      a: { point: [0, 0], dir: [-1, 0] },
      b: { point: [r6(g.header.length), 0], dir: [1, 0] },
    },
    drops: drops.length,
    firstDropX: r6(drops[0].x),
    lastDropX: r6(drops[drops.length - 1].x),
    dropFaceY: r6(g.dropHeight),
    branches: g.branches.map((b) => ({ role: b.role, x: r6(b.x), side: b.side, size_code: b.sizeCode, faceY: r6(b.face.point[1]) })),
    bbox: { minX: r6(g.bbox.minX), minY: r6(g.bbox.minY), maxX: r6(g.bbox.maxX), maxY: r6(g.bbox.maxY) },
  }
}

export function manifoldWeight(o: RowManifoldOptions): Weight {
  const g = manifoldGeometry(o)
  const density = alloyOf(o.alloy).density_lb_per_in3
  const drops = g.branches.filter((b) => b.role === "drop")
  const ports = g.branches.filter((b) => b.role !== "drop")
  const stubLb = (bs: ManifoldBranch[]) =>
    bs.reduce((s, b) => s + tubeMassLb(b.sizeCode, b.stubLength, density) + b.end.massLb, 0)
  const parts = [
    { label: "Header tube", lb: tubeMassLb(o.header, g.header.tubeLength, density) },
    { label: "Header ends", lb: g.header.ends.a.massLb + g.header.ends.b.massLb },
    { label: "Drop stubs and ends", lb: stubLb(drops) },
  ]
  if (ports.length) parts.push({ label: "Fill, drain, vent and instrument ports", lb: stubLb(ports) })
  const valves = drops.reduce((s, b) => s + (b.valve ? b.valve.massLb : 0), 0)
  if (valves > 0) parts.push({ label: "Drop isolation ball valves", lb: valves })
  return { per_unit_lb: g.approxWeightLb, parts }
}

const DOC_LABEL: Record<RowManifoldOptions["docs"][number], string> = {
  hydro: "Hydrostatic test certificate",
  mtr: "MTRs by heat number",
  pass: "Passivation certificate (ASTM A380)",
  weldmap: "Weld map",
}
const INCLUDED_DOCS = ["hydro", "mtr"]

const HEADER_END_ROLE: Partial<Record<EndConnectionCode, string>> = { tc: "ferrule", cap: "cap_weld" }

/** Informative fabricated breakdown: tube cuts, ferrules, valves and caps (always Quote). */
export function manifoldBom(o: RowManifoldOptions): Bom {
  const g = manifoldGeometry(o)
  const al = alloyOf(o.alloy)
  const d = al.digit
  const lines: BomLine[] = []
  const fab = { kind: "fabricated" as const }

  lines.push(
    line({
      ...fab,
      role: "tube",
      label: `Header tube, ${sizeLabel(o.header)} ${al.label} A270, cut ${formatInches(g.header.tubeLength)}${
        g.cutList.header_sticks > 1 ? ` (${g.cutList.header_sticks} sticks, welded joint)` : ""
      }`,
      qty: 1,
      size_code: o.header,
    }),
  )
  lines.push(
    line({
      ...fab,
      role: "tube",
      label: `Drop stub tube, ${sizeLabel(o.drop)} ${al.label} A270, cut ${formatInches(g.cutList.drop_stub_in)} each`,
      qty: o.drops,
      size_code: o.drop,
    }),
  )
  if (o.dstyle !== "uqd") {
    lines.push(line({ ...fab, role: "ferrule", label: `Drop ${roleLabel("ferrule")}, ${sizeLabel(o.drop)} ${al.label}`, qty: o.drops, vars: { d, s: o.drop }, size_code: o.drop }))
  } else {
    lines.push(
      line({
        ...fab,
        role: "end_fabricated",
        label: `UQD-ready plain stub, ${sizeLabel(o.drop)} (customer supplies the quick disconnect)`,
        qty: o.drops,
        size_code: o.drop,
      }),
    )
  }
  if (o.dstyle === "bv") {
    const s = o.drop
    lines.push(line({ ...fab, role: "valve_bv", label: `Drop isolation ${roleLabel("valve_bv")}, ${sizeLabel(s)}`, qty: o.drops, vars: { s }, size_code: s }))
    lines.push(line({ ...fab, role: "clamp", label: `${roleLabel("clamp")}, ${sizeLabel(s)} (drop valve)`, qty: o.drops, vars: { s }, size_code: s }))
    lines.push(line({ ...fab, role: "gasket_epdm", label: `${roleLabel("gasket_epdm")}, ${sizeLabel(s)} (drop valve)`, qty: o.drops, vars: { s }, size_code: s }))
  }

  // Header ends, grouped when both are the same.
  const ends = [g.header.ends.a.code, g.header.ends.b.code]
  const uniq = ends.filter((c, i) => ends.indexOf(c) === i)
  for (const code of uniq) {
    const qty = ends.filter((c) => c === code).length
    const role = HEADER_END_ROLE[code] ?? "end_fabricated"
    lines.push(
      line({
        ...fab,
        role,
        label: `Header end: ${endConnectionType(code).label}, ${sizeLabel(o.header)}`,
        qty,
        vars: role === "end_fabricated" ? undefined : { d, s: o.header },
        size_code: o.header,
      }),
    )
  }

  // Ports: TC ferrule + TC cap + clamp + gasket each, grouped by size.
  const ports = g.branches.filter((b) => b.role !== "drop")
  const sizes = ports.map((p) => p.sizeCode).filter((s, i, arr) => arr.indexOf(s) === i)
  for (const s of sizes) {
    const n = ports.filter((p) => p.sizeCode === s).length
    const which = ports
      .filter((p) => p.sizeCode === s)
      .map((p) => p.role)
      .filter((r, i, arr) => arr.indexOf(r) === i)
      .join(", ")
    lines.push(line({ ...fab, role: "ferrule", label: `Port ${roleLabel("ferrule")}, ${sizeLabel(s)} ${al.label} (${which})`, qty: n, vars: { d, s }, size_code: s }))
    lines.push(line({ ...fab, role: "cap_tc", label: `${roleLabel("cap_tc")}, ${sizeLabel(s)} (${which})`, qty: n, vars: { d, s }, size_code: s }))
    lines.push(line({ ...fab, role: "clamp", label: `${roleLabel("clamp")}, ${sizeLabel(s)} (${which})`, qty: n, vars: { s }, size_code: s }))
    lines.push(line({ ...fab, role: "gasket_epdm", label: `${roleLabel("gasket_epdm")}, ${sizeLabel(s)} (${which})`, qty: n, vars: { s }, size_code: s }))
  }

  for (const doc of o.docs) {
    lines.push(
      line({
        ...fab,
        role: "doc",
        // Included documents cost nothing extra; the others are priced on the quote.
        label: `${DOC_LABEL[doc]}${INCLUDED_DOCS.indexOf(doc) >= 0 ? " (included)" : ", quoted"}`,
        qty: 1,
      }),
    )
  }
  return { lines, units: o.pair === "1" ? 2 : 1 }
}

export function describeManifold(o: RowManifoldOptions): string {
  const [a, b] = manifoldEndCodes(o.ends)
  const ends = a === b ? endConnectionType(a).short : `${endConnectionType(a).short} X ${endConnectionType(b).short}`
  const style = o.dstyle === "tc" ? "TC" : o.dstyle === "bv" ? "BALL VALVE" : "UQD-READY"
  return `${sizeLabel(o.header)} ROW MANIFOLD ${o.drops} X ${sizeLabel(o.drop)} ${style} DROPS @ ${formatInches(o.pitch)} ${ends} ENDS ${alloyOf(o.alloy).label}`
}

export function manifoldDisplay(o: RowManifoldOptions) {
  const [a, b] = manifoldEndCodes(o.ends)
  return [
    { label: "Header OD", value: sizeLabel(o.header) },
    { label: "Drops", value: `${o.drops} × ${sizeLabel(o.drop)} at ${formatInches(o.pitch)} pitch` },
    { label: "Drop style", value: o.dstyle === "tc" ? "TC ferrule" : o.dstyle === "bv" ? "Sanitary branch with isolation ball valve" : "UQD-ready stub" },
    { label: "Header ends", value: a === b ? endConnectionType(a).label : `${endConnectionType(a).label} × ${endConnectionType(b).label}` },
    { label: "Supply/return pair", value: o.pair === "1" ? "Yes (2 headers)" : "No (1 header)" },
    { label: "Alloy", value: alloyOf(o.alloy).label },
    { label: "ID finish", value: `${o.finish} Ra max` },
    { label: "Fill, drain, vent", value: o.fill === "1" ? "Yes" : "No" },
    { label: "Instrument ports", value: o.inst === "1" ? "2 × 1/2\" TC" : "None" },
    { label: "Documentation", value: o.docs.map((x) => DOC_LABEL[x]).join(", ") || "None" },
    { label: "Header length", value: `${formatDim(manifoldHeaderLength(o))}"` },
  ]
}

export const ROW_MANIFOLD_BUILDER = makeBuilder<RowManifoldOptions, ManifoldGeometry>({
  type: "row-manifold",
  path: "/build/row-manifold",
  title: "Row Manifold",
  keys: ROW_MANIFOLD_KEYS,
  hasStep: true,
  partNumber: manifoldPartNumber,
  describe: describeManifold,
  display: manifoldDisplay,
  geometry: manifoldGeometry,
  expected: manifoldExpected,
  weight: manifoldWeight,
  bom: manifoldBom,
  standardRange: (o) => checkManifoldRange(o, manifoldGeometry(o)),
  specBlock: manifoldSpecBlock,
  leadTime: () => leadTimeOf("custom"),
})

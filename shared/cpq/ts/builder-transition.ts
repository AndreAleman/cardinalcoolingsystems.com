// Transition Spool builder (spec Page 3): a sanitary End A, a facility End B, optional concentric
// reducer when End B's size differs. Always Quote (welded); a matching stocked adapter is offered
// as stockedAlternative.
//
// Geometry: Sanitube's spool convention. Axis along +X, Face A (0,0) facing −X, Face B (L,0) facing
// +X. The tube at size od runs from End A's weld line; when od ≠ odb a concentric reducer (ASME B16.9
// length, by the larger size) sits directly behind End B's weld line.

import { formatInches, sizeToken } from "./units"
import { alloyOf, endConnectionType, hasEndConnectionRow, reducerLength, tubeDims } from "./tables"
import { axialBBox, endGeomFor, r6, segmentWallVolume } from "./geometry-common"
import { line, leadTimeOf, roleLabel, sizeLabel } from "./bom-lines"
import { makeBuilder } from "./builder-def"
import { TRANSITION_KEYS } from "./option-keys"
import { transitionPartNumber } from "./part-number"
import { transitionSpecBlock } from "./spec-block"
import { checkTransitionRange } from "./standard-range"
import type {
  AxialSegment,
  Bom,
  BomLine,
  EndConnectionCode,
  OptionError,
  TransitionGeometry,
  TransitionOptions,
  Vec2,
  Weight,
} from "./types"

export function transitionGeometry(o: TransitionOptions): TransitionGeometry {
  const A = tubeDims(o.od)
  const B = tubeDims(o.odb)
  const L = o.len
  const a = endGeomFor(o.a, o.od)
  const b = endGeomFor(o.b, o.odb)
  const weldA: Vec2 = [a.length, 0]
  const weldB: Vec2 = [L - b.length, 0]
  const reducing = o.od !== o.odb
  const H = reducing ? reducerLength(Math.max(o.od, o.odb)) : 0
  const reducer = reducing ? { x0: weldB[0] - H, x1: weldB[0], length: H } : null
  const tubeEnd = reducer ? reducer.x0 : weldB[0]
  const tubeStraight = tubeEnd - weldA[0]

  const segments: AxialSegment[] = []
  if (tubeStraight > 1e-9) {
    segments.push({ x0: weldA[0], x1: tubeEnd, r0: A.od / 2, r1: A.od / 2, ri0: A.id / 2, ri1: A.id / 2, style: "tube" })
  }
  if (reducer && reducer.x1 > Math.max(reducer.x0, weldA[0]) + 1e-9) {
    segments.push({
      x0: reducer.x0,
      x1: reducer.x1,
      r0: A.od / 2,
      r1: B.od / 2,
      ri0: A.id / 2,
      ri1: B.id / 2,
      style: "cone",
    })
  }
  const density = alloyOf(o.alloy).density_lb_per_in3
  const tubeVolumeIn3 = segments.reduce((s, x) => s + segmentWallVolume(x), 0)
  return {
    kind: "transition",
    od: A.od,
    odb: B.od,
    wall: A.wall,
    wallB: B.wall,
    id: A.id,
    idb: B.id,
    overallLength: L,
    ends: { a, b },
    faces: { a: { point: [0, 0], dir: [-1, 0], end: a }, b: { point: [L, 0], dir: [1, 0], end: b } },
    weldA,
    weldB,
    reducer,
    tubeStraight,
    segments,
    bbox: axialBBox(L, a, b, segments, A.od, B.od),
    tubeVolumeIn3,
    approxWeightLb: tubeVolumeIn3 * density + a.massLb + b.massLb,
  }
}

/** What cad-service checks (every leaf within 1e-3). */
export function transitionExpected(o: TransitionOptions): Record<string, unknown> {
  const g = transitionGeometry(o)
  return {
    overallLength: r6(g.overallLength),
    tubeStraight: r6(g.tubeStraight),
    weldA: [r6(g.weldA[0]), 0],
    weldB: [r6(g.weldB[0]), 0],
    reducer: g.reducer ? { x0: r6(g.reducer.x0), x1: r6(g.reducer.x1) } : null,
    faces: {
      a: { point: [0, 0], dir: [-1, 0] },
      b: { point: [r6(g.overallLength), 0], dir: [1, 0] },
    },
    bbox: { minX: r6(g.bbox.minX), minY: r6(g.bbox.minY), maxX: r6(g.bbox.maxX), maxY: r6(g.bbox.maxY) },
    tubeVolumeIn3: r6(g.tubeVolumeIn3),
  }
}

export function transitionWeight(o: TransitionOptions): Weight {
  const g = transitionGeometry(o)
  const density = alloyOf(o.alloy).density_lb_per_in3
  const tubeLb = g.segments.filter((s) => s.style === "tube").reduce((s, x) => s + segmentWallVolume(x), 0) * density
  const redLb = g.segments.filter((s) => s.style === "cone").reduce((s, x) => s + segmentWallVolume(x), 0) * density
  const parts = [
    { label: "Tube", lb: tubeLb },
    { label: `End A (${endConnectionType(o.a).short})`, lb: g.ends.a.massLb },
    { label: `End B (${endConnectionType(o.b).short})`, lb: g.ends.b.massLb },
  ]
  if (g.reducer) parts.push({ label: "Concentric reducer", lb: redLb })
  return { per_unit_lb: g.approxWeightLb, parts }
}

/** End A component role (stocked ferrules the shop welds on); bw has none. */
const END_A_ROLE: Record<TransitionOptions["a"], string | null> = {
  tc: "ferrule",
  mil: "ferrule_mil",
  fil: "ferrule_fil",
  pbs: "ferrule_pbs",
  tbs: "ferrule_tbs",
  bw: null,
}


/** Informative fabricated breakdown (every line is fabricated: the spool is welded, B1 → Quote). */
export function transitionBom(o: TransitionOptions): Bom {
  const g = transitionGeometry(o)
  const d = alloyOf(o.alloy).digit
  const lines: BomLine[] = []
  lines.push(
    line({
      role: "tube",
      label: `${roleLabel("tube")}, ${sizeLabel(o.od)} ${alloyOf(o.alloy).label}, cut ${formatInches(Math.max(0, g.tubeStraight))}`,
      qty: 1,
      kind: "fabricated",
      size_code: o.od,
    }),
  )
  const roleA = END_A_ROLE[o.a]
  if (roleA) {
    lines.push(
      line({
        role: roleA,
        label: `End A: ${roleLabel(roleA)}, ${sizeLabel(o.od)} ${alloyOf(o.alloy).label}`,
        qty: 1,
        kind: "fabricated",
        vars: { d, s: o.od },
        size_code: o.od,
      }),
    )
  }
  lines.push(
    line({
      role: "end_fabricated",
      label: `End B: ${endConnectionType(o.b).label}, ${sizeLabel(o.odb)}`,
      qty: 1,
      kind: "fabricated",
      size_code: o.odb,
    }),
  )
  if (g.reducer) {
    const big = Math.max(o.od, o.odb)
    const small = Math.min(o.od, o.odb)
    lines.push(
      line({
        role: "reducer_bw",
        label: `${roleLabel("reducer_bw")}, ${sizeLabel(big)} × ${sizeLabel(small)} ${alloyOf(o.alloy).label}`,
        qty: 1,
        kind: "fabricated",
        vars: { d, s: big, s2: small },
        size_code: big,
      }),
    )
  }
  return { lines, units: o.qty }
}

/** Stocked TC × End B adapter roles (only when End A is tc and there is no reducer). */
const ADAPTER_ROLE: Partial<Record<EndConnectionCode, string>> = {
  fl150: "adapter_fl150",
  fl300: "adapter_fl300",
  mnpt: "adapter_mnpt",
  fnpt: "adapter_fnpt",
  grv: "adapter_grv",
  bwp: "adapter_bwp",
}

/**
 * The stocked adapter that does the job of this transition (spec Page 3: "a 2" TC × 2" NPT
 * adapter"), as a SKU line the resolver can price Instant; null when none could exist. Its length is
 * the adapter's own, not `len`.
 */
export function transitionStockedAlternative(o: TransitionOptions): BomLine | null {
  if (o.a !== "tc" || o.od !== o.odb) return null
  const role = ADAPTER_ROLE[o.b]
  if (!role) return null
  const l = line({
    role,
    label: `${roleLabel(role)}, ${sizeLabel(o.od)} ${alloyOf(o.alloy).label} (stocked adapter, fixed length)`,
    qty: 1,
    kind: "sku",
    vars: { d: alloyOf(o.alloy).digit, s: o.od },
    size_code: o.od,
  })
  return l.candidates.length ? l : null
}

export function describeTransition(o: TransitionOptions): string {
  const size = o.od === o.odb ? sizeLabel(o.od) : `${sizeLabel(o.od)} × ${sizeLabel(o.odb)}`
  return `${size} TRANSITION SPOOL ${formatInches(o.len)} OAL ${endConnectionType(o.a).short} X ${endConnectionType(o.b).short} ${alloyOf(o.alloy).label}`
}

export function transitionDisplay(o: TransitionOptions) {
  return [
    { label: "End A", value: endConnectionType(o.a).label },
    { label: "End B", value: endConnectionType(o.b).label },
    { label: "Size A (Tube OD)", value: sizeLabel(o.od) },
    { label: "Size B", value: o.odb === o.od ? sizeLabel(o.odb) : `${sizeLabel(o.odb)} (reducing)` },
    { label: "Overall Length", value: formatInches(o.len) },
    { label: "Alloy", value: alloyOf(o.alloy).label },
    { label: "Quantity", value: String(o.qty) },
  ]
}

function transitionCross(o: TransitionOptions): OptionError[] {
  const errors: OptionError[] = []
  if (!hasEndConnectionRow(o.a, o.od)) errors.push({ key: "a", message: `${endConnectionType(o.a).label} is not available at ${sizeToken(o.od)}` })
  if (!hasEndConnectionRow(o.b, o.odb)) errors.push({ key: "b", message: `${endConnectionType(o.b).label} is not available at ${sizeToken(o.odb)}` })
  return errors
}

export const TRANSITION_BUILDER = makeBuilder<TransitionOptions, TransitionGeometry>({
  type: "transition",
  path: "/build/transition",
  title: "Transition Spool",
  unitNoun: { one: "spool", many: "spools" },
  keys: TRANSITION_KEYS,
  normalize: (o, ctx) => {
    // odb defaults to od (a plain transition) unless the link gives a valid one.
    if (!ctx.given("odb")) return { ...o, odb: o.od }
    return o
  },
  cross: transitionCross,
  hasStep: true,
  partNumber: transitionPartNumber,
  describe: describeTransition,
  display: transitionDisplay,
  geometry: transitionGeometry,
  expected: transitionExpected,
  weight: transitionWeight,
  bom: transitionBom,
  standardRange: (o) => checkTransitionRange(o, transitionGeometry(o)),
  specBlock: transitionSpecBlock,
  leadTime: () => leadTimeOf("custom"),
  stockedAlternative: transitionStockedAlternative,
})

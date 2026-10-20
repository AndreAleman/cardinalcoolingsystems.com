// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Hose Assembly builder (spec Page 4): stainless braided hose, TC End A, TC / male NPT / 150# flange
// End B, cover and sleeve options. Instant only for a stocked standard length (24/36/48/72 in) with
// the standard overbraid and no sleeve; none are stocked today, so it resolves Quote (B1).
//
// Geometry (approximate): axis along +X, Face A (0,0), Face B (L,0) where L = assembly length face to
// face; a collar behind each end fitting, the hose between them.

import { formatInches } from "./units"
import { ASSEMBLIES, HOSE_STOCK_LENGTHS_IN, clampMassLb, endConnectionType, hasEndConnectionRow, tubeDims } from "./tables"
import { axialBBox, endGeomFor, r6 } from "./geometry-common"
import { line, roleLabel, sizeLabel } from "./bom-lines"
import { makeBuilder } from "./builder-def"
import { HOSE_KEYS } from "./option-keys"
import { hoseEndB, hosePartNumber } from "./part-number"
import { hoseSpecBlock } from "./spec-block"
import { checkHoseRange } from "./standard-range"
import type { AxialSegment, Bom, BomLine, HoseGeometry, HoseOptions, OptionError, Weight } from "./types"

/** Crimp collar behind each end fitting, and the hose OD over the tube OD (draft). */
const COLLAR_IN = 1.5
const HOSE_OD_EXTRA_IN = 0.25

function hoseRow(size: number) {
  const r = ASSEMBLIES.hoses.find((h) => h.size_code === size)
  if (!r) throw new Error(`No hose row for size ${size}`)
  return r
}

/** Assembly working pressure: the lowest of the hose, the cover and the TC clamp joint. */
export function hoseRatedPsi(o: Pick<HoseOptions, "size" | "cover">): number {
  const hose = hoseRow(o.size).rated_psi
  const cover = ASSEMBLIES.hose_covers.find((c) => c.cover === o.cover)?.max_psi ?? null
  const clamp = ASSEMBLIES.tc_clamp_max_psi.find((c) => c.size_code === o.size)?.psi ?? null
  return Math.min(hose, cover ?? Infinity, clamp ?? Infinity)
}

/** True when this hose is a stocked standard: standard length, overbraid, no sleeve (spec Page 4). */
export function isStandardHose(o: Pick<HoseOptions, "len" | "cover" | "sleeve">): boolean {
  return HOSE_STOCK_LENGTHS_IN.indexOf(o.len) >= 0 && o.cover === "braid" && o.sleeve === "none"
}

export function hoseGeometry(o: HoseOptions): HoseGeometry {
  const t = tubeDims(o.size)
  const a = endGeomFor("tc", o.size)
  const b = endGeomFor(hoseEndB(o.ends), o.size)
  const L = o.len
  const hoseR = (t.od + HOSE_OD_EXTRA_IN) / 2
  const collarR = hoseR + 0.1
  const xa = a.length
  const xb = L - b.length
  const segments: AxialSegment[] = [
    { x0: xa, x1: xa + COLLAR_IN, r0: collarR, r1: collarR, ri0: null, ri1: null, style: "body" },
    { x0: xa + COLLAR_IN, x1: xb - COLLAR_IN, r0: hoseR, r1: hoseR, ri0: null, ri1: null, style: "hose" },
    { x0: xb - COLLAR_IN, x1: xb, r0: collarR, r1: collarR, ri0: null, ri1: null, style: "body" },
  ]
  const hoseLenIn = Math.max(0, xb - xa - 2 * COLLAR_IN)
  const collarLb = 2 * 0.2 * t.od
  return {
    kind: "hose",
    od: t.od,
    length: L,
    ends: { a, b },
    faces: { a: { point: [0, 0], dir: [-1, 0], end: a }, b: { point: [L, 0], dir: [1, 0], end: b } },
    segments,
    ratedPsi: hoseRatedPsi(o),
    minBendRadius: hoseRow(o.size).min_bend_radius_in,
    bbox: axialBBox(L, a, b, segments, t.od, t.od),
    approxWeightLb: (hoseRow(o.size).lb_per_ft * hoseLenIn) / 12 + collarLb + a.massLb + b.massLb,
  }
}

export function hoseExpected(o: HoseOptions): Record<string, unknown> {
  const g = hoseGeometry(o)
  return {
    length: r6(g.length),
    bbox: { minX: r6(g.bbox.minX), minY: r6(g.bbox.minY), maxX: r6(g.bbox.maxX), maxY: r6(g.bbox.maxY) },
  }
}

/** TC joints the hose's own ends make (1 per TC end). */
function tcEnds(o: HoseOptions): number {
  return o.ends === "tc-tc" ? 2 : 1
}

export function hoseWeight(o: HoseOptions): Weight {
  const g = hoseGeometry(o)
  const joints = tcEnds(o)
  const parts = [
    { label: "Hose assembly", lb: g.approxWeightLb },
    { label: "Clamps and gaskets", lb: joints * (clampMassLb(o.size) + ASSEMBLIES.components.gasket_mass_lb) },
  ]
  return { per_unit_lb: parts.reduce((s, p) => s + p.lb, 0), parts }
}

const COVER_LABEL: Record<HoseOptions["cover"], string> = {
  braid: "stainless overbraid",
  silicone: "silicone cover",
  ptfe: "PTFE-lined, stainless overbraid",
}

/** The hose assembly as one BOM line (used here and by the CDU kit). */
export function hoseLine(o: HoseOptions, qty = 1): BomLine {
  const standard = isStandardHose(o)
  const sleeve = o.sleeve === "none" ? "" : `, ${o.sleeve === "armor" ? "armor" : "fire"} sleeve`
  return line({
    role: "hose",
    label: `${roleLabel("hose")}, ${sizeLabel(o.size)} TC × ${endConnectionType(hoseEndB(o.ends)).short}, ${formatInches(o.len)}, ${COVER_LABEL[o.cover]}${sleeve}`,
    qty,
    kind: standard ? "sku" : "fabricated",
    vars: { d: "6", s: o.size },
    part_number: hosePartNumber(o),
    size_code: o.size,
    note: standard ? undefined : "Custom length or cover: made to order",
  })
}

export function hoseBom(o: HoseOptions): Bom {
  const s = o.size
  const joints = tcEnds(o)
  return {
    lines: [
      hoseLine(o),
      line({ role: "clamp", label: `${roleLabel("clamp")}, ${sizeLabel(s)}`, qty: joints, vars: { s }, size_code: s }),
      line({ role: "gasket_epdm", label: `${roleLabel("gasket_epdm")}, ${sizeLabel(s)}`, qty: joints, vars: { s }, size_code: s }),
    ],
    units: o.qty,
  }
}

export function describeHose(o: HoseOptions): string {
  const sleeve = o.sleeve === "none" ? "" : ` ${o.sleeve.toUpperCase()} SLEEVE`
  return `${sizeLabel(o.size)} HOSE ASSEMBLY ${formatInches(o.len)} TC X ${endConnectionType(hoseEndB(o.ends)).short} ${COVER_LABEL[o.cover].toUpperCase()}${sleeve}`
}

export function hoseDisplay(o: HoseOptions) {
  return [
    { label: "Size", value: sizeLabel(o.size) },
    { label: "Length", value: formatInches(o.len) },
    { label: "Ends", value: `TC × ${endConnectionType(hoseEndB(o.ends)).label}` },
    { label: "Cover", value: COVER_LABEL[o.cover] },
    { label: "Sleeve", value: o.sleeve === "none" ? "None" : o.sleeve === "armor" ? "Armor" : "Fire" },
    { label: "Working pressure", value: `${hoseRatedPsi(o)} psi` },
    { label: "Quantity", value: String(o.qty) },
  ]
}

function hoseCross(o: HoseOptions): OptionError[] {
  const b = hoseEndB(o.ends)
  return hasEndConnectionRow(b, o.size)
    ? []
    : [{ key: "ends", message: `${endConnectionType(b).label} is not available on a ${sizeLabel(o.size)} hose` }]
}

export const HOSE_BUILDER = makeBuilder<HoseOptions, HoseGeometry>({
  type: "hose",
  path: "/build/hose",
  title: "Hose Assembly",
  unitNoun: { one: "hose", many: "hoses" },
  summaryParts: { exclude: ["hose"] },
  keys: HOSE_KEYS,
  normalize: (o, ctx) => {
    // NPT and flange ends start at 1": a smaller size resets the ends.
    if (hoseCross(o).length) {
      ctx.ignore("ends")
      return { ...o, ends: "tc-tc" }
    }
    return o
  },
  cross: hoseCross,
  hasStep: false,
  partNumber: hosePartNumber,
  describe: describeHose,
  display: hoseDisplay,
  geometry: hoseGeometry,
  expected: hoseExpected,
  weight: hoseWeight,
  bom: hoseBom,
  standardRange: (o) => checkHoseRange(o, hoseGeometry(o)),
  specBlock: hoseSpecBlock,
})

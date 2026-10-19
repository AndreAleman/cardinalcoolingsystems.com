#!/usr/bin/env node
// Regenerates shared/cpq/dimensions/end-connections.json for Cardinal (plan B10).
//
//   node shared/cpq/tools/gen-end-connections.mjs
//
// - Keeps Sanitube's types and rows (bw, tc, mil, fil, pbs, tbs, mnpt) exactly as they are, except
//   for the added `mass_lb`.
// - Adds Cardinal's ends (fl150, fl300, fnpt, grv, bwp, cap) for the transition / manifold sizes, as
//   revolved OUTER half-sections the CAD service can revolve, the same way Sanitube's rows are.
// - Computes `mass_lb` for every row: volume of the revolved outer profile minus the bore, × the
//   T316L density (0.290 lb/in³). Every value is an estimate: verified stays false.
//
// Idempotent: run it again after a table edit, then node scripts/sync-cpq-shared.mjs.
// Plain Node >= 20, no dependencies.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SHARED = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const FILE = path.join(SHARED, "dimensions/end-connections.json")
const TUBES = JSON.parse(fs.readFileSync(path.join(SHARED, "dimensions/tube-sizes.json"), "utf8")).sizes
const DENSITY = 0.29 // T316L, lb/in³ (materials.json)

const SANITUBE_CODES = ["bw", "tc", "mil", "fil", "pbs", "tbs", "mnpt"]
const CARDINAL_SIZES = [100, 150, 200, 250, 300, 400, 600, 800]

const r3 = (n) => Math.round(n * 1000) / 1000
const r4 = (n) => Math.round(n * 10000) / 10000

// ---------------------------------------------------------------- reference data (verified: false)

// ASME B16.5 Class 150 / 300, NPS 1–8, nominal tube size → same NPS.
// O = flange OD, tf = flange thickness incl. the 0.06" raised face, X = hub diameter at the flange,
// Y = weld-neck length through the hub (incl. raised face), R = raised-face diameter.
const B165 = {
  150: {
    100: { O: 4.25, tf: 0.56, X: 1.94, Y: 2.19, R: 2.0 },
    150: { O: 5.0, tf: 0.69, X: 2.56, Y: 2.44, R: 2.88 },
    200: { O: 6.0, tf: 0.75, X: 3.06, Y: 2.5, R: 3.62 },
    250: { O: 7.0, tf: 0.88, X: 3.56, Y: 2.75, R: 4.12 },
    300: { O: 7.5, tf: 0.94, X: 4.25, Y: 2.75, R: 5.0 },
    400: { O: 9.0, tf: 0.94, X: 5.31, Y: 3.0, R: 6.19 },
    600: { O: 11.0, tf: 1.0, X: 7.56, Y: 3.5, R: 8.5 },
    800: { O: 13.5, tf: 1.12, X: 9.69, Y: 4.0, R: 10.62 },
  },
  300: {
    100: { O: 4.88, tf: 0.69, X: 2.12, Y: 2.44, R: 2.0 },
    150: { O: 6.12, tf: 0.81, X: 2.75, Y: 2.69, R: 2.88 },
    200: { O: 6.5, tf: 0.88, X: 3.31, Y: 2.75, R: 3.62 },
    250: { O: 7.5, tf: 1.0, X: 3.94, Y: 3.0, R: 4.12 },
    300: { O: 8.25, tf: 1.12, X: 4.62, Y: 3.12, R: 5.0 },
    400: { O: 10.0, tf: 1.25, X: 5.75, Y: 3.38, R: 6.19 },
    600: { O: 12.5, tf: 1.44, X: 8.12, Y: 3.88, R: 8.5 },
    800: { O: 15.0, tf: 1.62, X: 10.25, Y: 4.38, R: 10.62 },
  },
}

// ASME B1.20.1 NPT: pipe OD D and effective thread length L2 (same values as Sanitube's mnpt rows).
const NPT = {
  100: { D: 1.315, L2: 0.683 },
  150: { D: 1.9, L2: 0.724 },
  200: { D: 2.375, L2: 0.757 },
  250: { D: 2.875, L2: 1.138 },
  300: { D: 3.5, L2: 1.2 },
  400: { D: 4.5, L2: 1.3 },
  600: { D: 6.625, L2: 1.513 },
  800: { D: 8.625, L2: 1.713 },
}

// IPS pipe OD + Sch 10S wall (ASME B36.19M) and the standard roll groove (AWWA C606 / Victaulic
// roll-groove specification): A = gasket seat (face → groove), B = groove width, C = groove diameter.
const IPS = {
  100: { D: 1.315, t10: 0.109, A: 0.625, B: 0.281, C: 1.19 },
  150: { D: 1.9, t10: 0.109, A: 0.625, B: 0.281, C: 1.775 },
  200: { D: 2.375, t10: 0.109, A: 0.625, B: 0.344, C: 2.25 },
  250: { D: 2.875, t10: 0.12, A: 0.625, B: 0.344, C: 2.72 },
  300: { D: 3.5, t10: 0.12, A: 0.625, B: 0.344, C: 3.344 },
  400: { D: 4.5, t10: 0.12, A: 0.625, B: 0.344, C: 4.334 },
  600: { D: 6.625, t10: 0.134, A: 0.625, B: 0.344, C: 6.455 },
  800: { D: 8.625, t10: 0.148, A: 0.75, B: 0.469, C: 8.441 },
}

// ---------------------------------------------------------------- geometry helpers

/** Volume of a solid revolved from a polyline [x, r] (x non-decreasing): Σ frustums. */
function revolvedVolume(pts) {
  let v = 0
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, a] = pts[i]
    const [x1, b] = pts[i + 1]
    const h = x1 - x0
    if (h > 0) v += (Math.PI / 3) * h * (a * a + a * b + b * b)
  }
  return v
}

function tube(size) {
  const t = TUBES.find((r) => r.size_code === size)
  if (!t) throw new Error(`no tube ${size}`)
  return { od: t.od_in, id: t.od_in - 2 * t.wall_in, wall: t.wall_in, label: t.label }
}

/** mass_lb = density × (outer revolved volume − inner revolved volume). */
function massOf(outer, inner) {
  const v = revolvedVolume(outer) - revolvedVolume(inner)
  return r3(Math.max(0, v) * DENSITY)
}

/** Inner (bore) profile for Sanitube rows: tube ID from face to weld line, or the row's bore. */
function sanitubeMass(row) {
  if (row.length_in <= 0 || row.profile.length === 0) return 0
  const t = tube(row.size_code)
  const rIn = (row.bore_in ?? t.id) / 2
  return massOf(row.profile, [
    [0, rIn],
    [row.length_in, rIn],
  ])
}

// ---------------------------------------------------------------- Cardinal rows

function flangeRow(cls, size) {
  const f = B165[cls][size]
  const t = tube(size)
  const profile = [
    [0, f.R / 2],
    [0.06, f.R / 2],
    [0.06, f.O / 2],
    [f.tf, f.O / 2],
    [f.tf, f.X / 2],
    [f.Y, t.od / 2],
  ].map(([x, r]) => [r4(x), r4(r)])
  const inner = [
    [0, t.id / 2],
    [f.Y, t.id / 2],
  ]
  return {
    code: `fl${cls}`,
    size_code: size,
    length_in: f.Y,
    max_od_in: f.O,
    profile,
    bore_in: null,
    mass_lb: massOf(profile, inner),
    source: `draft: ASME B16.5-2020 Class ${cls} raised-face weld-neck flange, NPS ${t.label.replace(/"/g, "")} (tube nominal = NPS): flange OD ${f.O}", thickness ${f.tf}" incl. 0.06" raised face (RF Ø${f.R}"), hub Ø${f.X}" tapering to the tube OD over the ${f.Y}" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.`,
    verified: false,
  }
}

function fnptRow(size) {
  const n = NPT[size]
  const t = tube(size)
  const bodyOd = n.D + 0.5
  const L = r3(n.L2 + 0.5)
  const profile = [
    [0, bodyOd / 2],
    [n.L2 + 0.25, bodyOd / 2],
    [n.L2 + 0.375, t.od / 2],
    [L, t.od / 2],
  ].map(([x, r]) => [r4(x), r4(r)])
  const inner = [
    [0, n.D / 2],
    [n.L2 + 0.25, n.D / 2],
    [n.L2 + 0.25, t.id / 2],
    [L, t.id / 2],
  ]
  return {
    code: "fnpt",
    size_code: size,
    length_in: L,
    max_od_in: r3(bodyOd),
    profile,
    bore_in: n.D,
    mass_lb: massOf(profile, inner),
    source: `draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D ${n.D}" (bore_in = thread envelope) and effective thread length L2 ${n.L2}" + 0.25" body; body OD ≈ D + 0.5"; 0.125" taper + 0.125" weld land to the tube OD. Draft.`,
    verified: false,
  }
}

function grvRow(size) {
  const g = IPS[size]
  const t = tube(size)
  const pipeEnd = g.A + g.B + 1.0
  const L = r3(pipeEnd + 0.75)
  const profile = [
    [0, g.D / 2],
    [g.A, g.D / 2],
    [g.A, g.C / 2],
    [g.A + g.B, g.C / 2],
    [g.A + g.B, g.D / 2],
    [pipeEnd, g.D / 2],
    [pipeEnd + 0.5, t.od / 2],
    [L, t.od / 2],
  ].map(([x, r]) => [r4(x), r4(r)])
  const pid = g.D - 2 * g.t10
  const inner = [
    [0, pid / 2],
    [pipeEnd, pid / 2],
    [pipeEnd + 0.5, t.id / 2],
    [L, t.id / 2],
  ]
  return {
    code: "grv",
    size_code: size,
    length_in: L,
    max_od_in: g.D,
    profile,
    bore_in: r4(pid),
    mass_lb: massOf(profile, inner),
    source: `draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS ${t.label.replace(/"/g, "")}: pipe OD ${g.D}" Sch 10S (ASME B36.19M, wall ${g.t10}"), gasket seat A ${g.A}", groove width B ${g.B}", groove Ø${g.C}" (groove approximated as a square revolved notch); 1" of pipe past the groove, 0.5" cone to the tube OD, 0.25" weld land. Draft.`,
    verified: false,
  }
}

function bwpRow(size) {
  const g = IPS[size]
  const t = tube(size)
  const L = 3
  const profile = [
    [0, g.D / 2],
    [2, g.D / 2],
    [2.5, t.od / 2],
    [L, t.od / 2],
  ].map(([x, r]) => [r4(x), r4(r)])
  const pid = g.D - 2 * g.t10
  const inner = [
    [0, pid / 2],
    [2, pid / 2],
    [2.5, t.id / 2],
    [L, t.id / 2],
  ]
  return {
    code: "bwp",
    size_code: size,
    length_in: L,
    max_od_in: g.D,
    profile,
    bore_in: r4(pid),
    mass_lb: massOf(profile, inner),
    source: `draft: butt-weld pipe adapter, plain square end of NPS ${t.label.replace(/"/g, "")} Sch 10S pipe (ASME B36.19M: OD ${g.D}", wall ${g.t10}"), 2" of pipe, 0.5" cone to the tube OD, 0.5" weld land. Draft.`,
    verified: false,
  }
}

function capRow(size) {
  const t = tube(size)
  const R = t.od / 2
  const h = t.od / 4 // 2:1 ellipsoidal head depth
  const skirt = 0.375
  const L = r3(h + skirt)
  const N = 6
  const ellipse = (rr, hh, x0) => {
    const out = []
    for (let i = 0; i <= N; i++) {
      const x = (hh * i) / N
      const r = rr * Math.sqrt(Math.max(0, 1 - ((hh - x) / hh) ** 2))
      out.push([x0 + x, r])
    }
    return out
  }
  const profile = [...ellipse(R, h, 0), [L, R]].map(([x, r]) => [r4(x), r4(r)])
  const inner = [...ellipse(R - t.wall, h - t.wall, t.wall), [L, R - t.wall]]
  return {
    code: "cap",
    size_code: size,
    length_in: L,
    max_od_in: t.od,
    profile,
    bore_in: 0,
    mass_lb: massOf(profile, inner),
    source: `draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = ${r3(h)}") + 0.375" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.`,
    verified: false,
  }
}

// ---------------------------------------------------------------- types

const CARDINAL_TYPES = [
  { code: "fl150", label: "150# RF FLANGE", short: "150# FLG", pn_token: "fl150", sort: 8 },
  { code: "fl300", label: "300# RF FLANGE", short: "300# FLG", pn_token: "fl300", sort: 9 },
  { code: "fnpt", label: "FEMALE NPT THREAD", short: "FNPT", pn_token: "fnpt", sort: 10 },
  { code: "grv", label: "IPS GROOVED END", short: "GROOVED", pn_token: "grv", sort: 11 },
  { code: "bwp", label: "BUTT-WELD PIPE END (SCH 10S)", short: "BW PIPE", pn_token: "bwp", sort: 12 },
  { code: "cap", label: "WELDED END CAP", short: "CAP", pn_token: "cap", sort: 13 },
]

// ---------------------------------------------------------------- main

const table = JSON.parse(fs.readFileSync(FILE, "utf8"))
const sanTypes = table.types.filter((t) => SANITUBE_CODES.includes(t.code))
const sanRows = table.rows
  .filter((r) => SANITUBE_CODES.includes(r.code))
  .map((r) => {
    const { mass_lb: _drop, ...rest } = r
    // Key order: keep Sanitube's, insert mass_lb before source.
    const { source, verified, ...geom } = rest
    return { ...geom, mass_lb: sanitubeMass(rest), source, verified }
  })

const cardRows = []
for (const size of CARDINAL_SIZES) {
  cardRows.push(flangeRow(150, size), flangeRow(300, size), fnptRow(size), grvRow(size), bwpRow(size), capRow(size))
}

const out = {
  version: "2026-10-18-cardinal-draft",
  status: "draft: Sanitube rows pending Houston sign-off (H2); Cardinal rows pending Todd",
  units: "in",
  notes: [
    "profile = OUTER half-section [axial_from_face_in, radius_in], face (0) → weld line (length_in).",
    "Only bw rows are verified. Every other row is a draft for Houston to check (H2, H28).",
    "Rows bw, tc, mil, fil, pbs, tbs, mnpt are Sanitube's, unchanged apart from mass_lb (scripts/check-sanitube-tables.mjs compares them).",
    "Cardinal rows (fl150, fl300, fnpt, grv, bwp, cap) are written by shared/cpq/tools/gen-end-connections.mjs. Flange bolt holes are not modelled.",
    "mass_lb = T316L density 0.290 lb/in³ × (revolved outer profile − bore), an estimate (verified false). Weights add the two end masses to the tube.",
    "bore_in: null = tube ID; 0 = closed (cap); otherwise the bore at the face (fnpt thread envelope, grv/bwp pipe ID).",
  ],
  types: [...sanTypes, ...CARDINAL_TYPES],
  rows: [...sanRows, ...cardRows],
}

fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + "\n")
console.log(`end-connections.json: ${sanRows.length} Sanitube rows + ${cardRows.length} Cardinal rows`)

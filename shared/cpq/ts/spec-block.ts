// Spec Blocks: the paste-ready paragraph on every builder output (spec "Shared components"), because
// that text ends up in a submittal. Facts only: alloy, finish, standard, weld method, cleaning,
// test pressure, certifications. Values come from the tables (assemblies.json), never from the page.

import { formatInches } from "./units"
import { ASSEMBLIES, alloyOf, tubeDims } from "./tables"
import { manifoldEndCodes, hoseEndB } from "./part-number"
import type { CduKitOptions, HoseOptions, RowManifoldOptions, StrainerOptions, TransitionOptions } from "./types"

const sz = (code: number) => tubeDims(code).label

const END_STANDARD: Record<string, string> = {
  tc: "3-A tri-clamp ferrule",
  mil: "I-Line male ferrule",
  fil: "I-Line female ferrule",
  pbs: "plain bevel seat ferrule with nut",
  tbs: "threaded bevel seat ferrule",
  bw: "plain square-cut weld end",
  fl150: "ASME B16.5 Class 150 raised-face flange",
  fl300: "ASME B16.5 Class 300 raised-face flange",
  mnpt: "male NPT thread (ASME B1.20.1)",
  fnpt: "female NPT thread (ASME B1.20.1)",
  grv: "IPS roll-grooved end (AWWA C606)",
  bwp: "Sch 10S butt-weld pipe end (ASME B36.19M)",
  cap: "welded end cap",
}

const WELD = "orbital or manual GTAW with inert-gas (argon) purge"
const CLEAN = "cleaned, pickled and passivated per ASTM A380"

export function transitionSpecBlock(o: TransitionOptions): string {
  const al = alloyOf(o.alloy).label
  const a = END_STANDARD[o.a]
  const b = END_STANDARD[o.b]
  const size = o.od === o.odb ? `${sz(o.od)} OD` : `${sz(o.od)} × ${sz(o.odb)} OD (concentric reducer per ASME B16.9)`
  return (
    `Transition spool, ${size}, ${formatInches(o.len)} overall length face to face. ` +
    `${al} stainless steel ASTM A270 sanitary tube, ${tubeDims(o.od).wall}" wall, 32 Ra max ID. ` +
    `End A: ${a}. End B: ${b}. ` +
    `Welded by ${WELD}; ${CLEAN}. Hydrostatic test certificate and MTRs by heat number available. ` +
    `3-A sanitary construction; ASME BPE documentation available on request.`
  )
}

const DOC_TEXT: Record<RowManifoldOptions["docs"][number], string> = {
  hydro: "hydrostatic test certificate",
  mtr: "MTRs by heat number",
  pass: "passivation certificate to ASTM A380",
  weldmap: "weld map",
}

export function manifoldSpecBlock(o: RowManifoldOptions): string {
  const m = ASSEMBLIES.manifold
  const al = alloyOf(o.alloy).label
  const [a, b] = manifoldEndCodes(o.ends)
  const ends = a === b ? `${END_STANDARD[a]} both ends` : `${END_STANDARD[a]} inlet, ${END_STANDARD[b]} far end`
  const style =
    o.dstyle === "tc" ? "3-A tri-clamp ferrule" : o.dstyle === "bv" ? "sanitary branch with tri-clamp isolation ball valve" : "plain stub, UQD-ready (quick disconnect by others)"
  const ports =
    o.fill === "1"
      ? ` ${sz(m.fill_size_code)} sanitary tri-clamp fill point, ${sz(m.drain_size_code)} drain and ${sz(m.vent_size_code)} air vent.`
      : ""
  const inst = o.inst === "1" ? ` ${m.instrument_ports} × ${sz(m.instrument_size_code)} tri-clamp instrument ports for temperature and pressure.` : ""
  const docs = o.docs.map((d) => DOC_TEXT[d])
  return (
    `TCS row manifold built to the OCP guideline for pre-commission preparation of TCS row manifolds. ` +
    `${sz(o.header)} OD header with ${o.drops} × ${sz(o.drop)} drops at ${formatInches(o.pitch)} centers, ${style}; ${ends}. ` +
    `${al} stainless steel ASTM A270 sanitary tube (OCP minimum grade 304), ${o.finish} Ra max ID finish.${ports}${inst} ` +
    `Inert-gas welded (${WELD}); ${CLEAN}. ` +
    `Hydrostatically tested at ${m.hydro_test_psig} psig.` +
    (docs.length ? ` Documentation: ${docs.join(", ")}.` : "") +
    (o.pair === "1" ? " Supplied as a supply and return pair." : "")
  )
}

const GASKET_TEXT: Record<CduKitOptions["gasket"], string> = {
  epdm: "EPDM (peroxide-cured) gaskets, compatible with water and PG25 propylene glycol loops",
  sil: "white silicone gaskets",
  ptfe: "PTFE gaskets",
}

export function kitSpecBlock(o: CduKitOptions): string {
  const al = alloyOf(o.alloy).label
  const run = o.run === "hard" ? `welded ${al} spools, ${formatInches(o.len)} face to face` : `stainless braided hose assemblies, ${formatInches(o.len)}`
  const far = { tc: "3-A tri-clamp", fl150: "ASME B16.5 Class 150 flange adapter", npt: "NPT adapter", grv: "IPS grooved adapter" }[o.far]
  const iso = { none: "", bfv: " Tri-clamp butterfly isolation valve on each port.", bv: " Tri-clamp 3-piece ball isolation valve on each port." }[o.iso]
  const strainer = o.strainer === "none" ? "" : ` 316L inline tri-clamp strainer (${o.strainer} body) on the supply side.`
  return (
    `CDU hookup kit, per CDU: supply and return runs of ${run}, ${far} far end.${iso}${strainer} ` +
    `3-A sanitary tri-clamp connections: ${al} ferrules, heavy-duty T304 single-pin clamps, ${GASKET_TEXT[o.gasket]}. ` +
    `Sanitary grade (3-A) throughout; ASME BPE documentation available on request.`
  )
}

export function strainerSpecBlock(o: StrainerOptions): string {
  const micron = ASSEMBLIES.strainer.mesh.find((m) => String(m.mesh) === o.mesh)?.micron
  return (
    `316L stainless steel inline tri-clamp strainer, ${sz(o.size)}, ${o.body} body, ${o.mesh} mesh screen (${micron} µm openings). ` +
    `Installed with heavy-duty T304 clamps and EPDM (peroxide-cured) gaskets.` +
    (o.iso === "1" ? " Tri-clamp ball isolation valve either side." : "") +
    (o.dp === "1" ? ` Differential-pressure ports, 2 × ${sz(ASSEMBLIES.strainer.dp_port_size_code)} tri-clamp.` : "") +
    ` 3-A sanitary construction.`
  )
}

export function hoseSpecBlock(o: HoseOptions): string {
  const cover = { braid: "stainless steel overbraid", silicone: "silicone cover", ptfe: "PTFE liner with stainless steel overbraid" }[o.cover]
  const sleeve = { none: "", armor: " Armor sleeve.", fire: " Fire sleeve." }[o.sleeve]
  return (
    `${sz(o.size)} hose assembly, ${formatInches(o.len)} overall, 316 stainless corrugated hose with ${cover}. ` +
    `End A: 3-A tri-clamp ferrule. End B: ${END_STANDARD[hoseEndB(o.ends)]}.${sleeve}`
  )
}

export { END_STANDARD }

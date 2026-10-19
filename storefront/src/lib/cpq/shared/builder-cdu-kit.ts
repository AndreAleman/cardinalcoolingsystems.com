// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// CDU Hookup Kit builder (spec Page 1): everything between a CDU's supply and return ports and the
// facility or TCS pipe. BOM rules per CDU, per port (bom-templates.json kit_rules, the spec's
// "BOM rules" table):
//   - joints per port: base 2 (CDU port ↔ run, run ↔ far end or its adapter) + 2 per valve
//   - strainer: supply side only, + 2 joints
//   - heavy-duty clamp + gasket per tri-clamp joint
//   - ferrules: 2 spool weld ends per hard-pipe run (hose ends come with the hose) + 1 for a
//     tri-clamp far end (the facility pipe's weld ferrule)
//   - transition adapter per port when the far end is not tri-clamp; a DIN hygienic flange × TC
//     adapter per port when the CDU port is DN50/DN80
//   - the run: a welded spool (fabricated → Quote) or a hose assembly (Instant only at a stocked
//     standard length)
//   - spares (optional): +10% gaskets rounded up and 1 clamp per kit
// No geometry (B8: a kit is several stocked parts, not one solid).

import { formatInches } from "./units"
import { ASSEMBLIES, KIT_RULES, alloyOf, clampMassLb, endConnectionRow, tubeMassLb, valveRow } from "./tables"
import { line, roleLabel, sizeLabel } from "./bom-lines"
import { makeBuilder } from "./builder-def"
import { CDU_KIT_KEYS } from "./option-keys"
import { kitPartNumber, spoolPartNumber } from "./part-number"
import { kitSpecBlock } from "./spec-block"
import { checkKitRange } from "./standard-range"
import { hoseLine, hoseGeometry } from "./builder-hose"
import { strainerLine, strainerGeometry } from "./builder-strainer"
import { DEFAULT_HOSE_OPTIONS, DEFAULT_STRAINER_OPTIONS } from "./option-keys"
import type {
  Bom,
  BomLine,
  CduKitOptions,
  CduPort,
  EndConnectionCode,
  HoseOptions,
  SizeCode,
  StrainerOptions,
  Weight,
} from "./types"

/** Known CDUs, port read from the manufacturer's datasheet (B13). Never guess a size. */
export const CDU_MODELS: readonly { key: CduKitOptions["cdu"]; label: string; port: CduPort | null; source: string }[] = [
  { key: "none", label: "Choose the port size", port: null, source: "" },
  {
    key: "boyd-10u",
    label: "Boyd 10U CDU",
    port: "tc150",
    source: "Boyd 10U Cooling Distribution Unit datasheet: 1.5\" sanitary (tri-clamp) supply and return ports",
  },
]

/** Tube size of a CDU port: tcNNN → NNN; DN50 → 2" (200), DN80 → 3" (300) hygienic flange. */
export function cduPortSize(port: CduPort): SizeCode {
  const m = /^tc(\d+)$/.exec(port)
  if (m) return Number(m[1])
  return port === "dn50" ? 200 : 300
}

export function isDnPort(port: CduPort): boolean {
  return port === "dn50" || port === "dn80"
}

const GASKET_ROLE: Record<CduKitOptions["gasket"], string> = { epdm: "gasket_epdm", sil: "gasket_sil", ptfe: "gasket_ptfe" }
const VALVE_ROLE: Record<"bfv" | "bv", string> = { bfv: "valve_bfv", bv: "valve_bv" }
const FAR_ADAPTER_ROLE: Record<Exclude<CduKitOptions["far"], "tc">, string> = {
  fl150: "adapter_fl150",
  npt: "adapter_npt",
  grv: "adapter_grv",
}
/** End Connection whose mass approximates the far adapter's facility side. */
const FAR_ADAPTER_END: Record<Exclude<CduKitOptions["far"], "tc">, EndConnectionCode> = {
  fl150: "fl150",
  npt: "fnpt",
  grv: "grv",
}

/** The kit's hose run as hose-builder options (size from the port, TC × TC, overbraid). */
export function kitHoseOptions(o: CduKitOptions): HoseOptions {
  return { ...DEFAULT_HOSE_OPTIONS, size: cduPortSize(o.port), len: o.len, ends: "tc-tc", qty: 1 }
}

/** The kit's strainer as strainer-builder options (size from the port, body from the kit). */
export function kitStrainerOptions(o: CduKitOptions): StrainerOptions | null {
  if (o.strainer === "none") return null
  return { ...DEFAULT_STRAINER_OPTIONS, size: cduPortSize(o.port), body: o.strainer, qty: 1 }
}

/** Joint counts per CDU (before spares). */
export function kitJoints(o: CduKitOptions): { perPort: number; strainer: number; total: number } {
  const r = KIT_RULES
  const perPort = r.base_joints_per_port + (o.iso === "none" ? 0 : r.joints_per_valve)
  const strainer = o.strainer === "none" ? 0 : r.joints_per_strainer * r.strainer_ports
  return { perPort, strainer, total: r.ports_per_cdu * perPort + strainer }
}

export function kitBom(o: CduKitOptions): Bom {
  const r = KIT_RULES
  const P = r.ports_per_cdu
  const s = cduPortSize(o.port)
  const al = alloyOf(o.alloy)
  const d = al.digit
  const sl = sizeLabel(s)
  const lines: BomLine[] = []

  // The run, one per port.
  if (o.run === "hard") {
    lines.push(
      line({
        role: "spool",
        template: "tube",
        label: `Spool, ${sl} TC × TC, ${formatInches(o.len)} face to face, ${al.label} (welded)`,
        qty: P,
        kind: "fabricated",
        part_number: spoolPartNumber("tc", "tc", o.len, o.alloy, s),
        size_code: s,
      }),
    )
  } else {
    lines.push(hoseLine(kitHoseOptions(o), P))
  }

  const ferrules = (o.run === "hard" ? P * r.spool_ferrules_per_port : 0) + (o.far === "tc" ? P * r.far_tc_ferrules_per_port : 0)
  if (ferrules > 0) {
    lines.push(
      line({
        role: "ferrule",
        label: `${roleLabel("ferrule")}, ${sl} ${al.label}`,
        qty: ferrules,
        vars: { d, s },
        size_code: s,
        note: [o.run === "hard" ? "spool weld ends" : "", o.far === "tc" ? "facility pipe end" : ""].filter((x) => x).join(" + "),
      }),
    )
  }

  const joints = kitJoints(o).total
  const spareGaskets = o.spares === "1" ? Math.ceil(joints * r.spare_gasket_fraction - 1e-9) : 0
  const spareClamps = o.spares === "1" ? r.spare_clamps_per_kit : 0
  lines.push(
    line({
      role: "clamp",
      label: `${roleLabel("clamp")}, ${sl}`,
      qty: joints + spareClamps,
      vars: { s },
      size_code: s,
      note: spareClamps ? `${joints} joints + ${spareClamps} spare` : `${joints} joints`,
    }),
  )
  const gRole = GASKET_ROLE[o.gasket]
  lines.push(
    line({
      role: gRole,
      label: `${roleLabel(gRole)}, ${sl}`,
      qty: joints + spareGaskets,
      vars: { s },
      size_code: s,
      note: spareGaskets ? `${joints} joints + ${spareGaskets} spare` : `${joints} joints`,
    }),
  )

  if (o.iso !== "none") {
    const vRole = VALVE_ROLE[o.iso]
    lines.push(line({ role: vRole, label: `${roleLabel(vRole)}, ${sl} (isolation, each port)`, qty: P, vars: { s }, size_code: s }))
  }
  const st = kitStrainerOptions(o)
  if (st) lines.push(strainerLine(st, r.strainer_ports))
  if (o.far !== "tc") {
    const aRole = FAR_ADAPTER_ROLE[o.far]
    lines.push(line({ role: aRole, label: `${roleLabel(aRole)}, ${sl} ${al.label} (far end)`, qty: P, vars: { d, s }, size_code: s }))
  }
  if (isDnPort(o.port)) {
    lines.push(
      line({
        role: "adapter_dn",
        label: `${roleLabel("adapter_dn")}, ${o.port.toUpperCase()} × ${sl} TC (CDU port)`,
        qty: P,
        size_code: s,
      }),
    )
  }
  return { lines, units: o.units }
}

/** Approximate mass of one unit of a kit line (lb), by role. */
function lineUnitMass(l: BomLine, o: CduKitOptions): number {
  const s = l.size_code ?? cduPortSize(o.port)
  const density = alloyOf(o.alloy).density_lb_per_in3
  const tc = endConnectionRow("tc", s).mass_lb
  switch (l.role) {
    case "spool":
      return tubeMassLb(s, o.len - 2 * endConnectionRow("tc", s).length_in, density)
    case "hose":
      return hoseGeometry(kitHoseOptions(o)).approxWeightLb
    case "strainer":
      return strainerGeometry(kitStrainerOptions(o) as StrainerOptions).approxWeightLb
    case "ferrule":
      return tc
    case "clamp":
      return clampMassLb(s)
    case "valve_bfv":
      return valveRow("bfv", s)?.mass_lb ?? 0
    case "valve_bv":
      return valveRow("bv", s)?.mass_lb ?? 0
    case "adapter_dn":
      return 2 * tc
    default:
      if (l.role.indexOf("gasket_") === 0) return ASSEMBLIES.components.gasket_mass_lb
      if (l.role.indexOf("adapter_") === 0 && o.far !== "tc") return tc + endConnectionRow(FAR_ADAPTER_END[o.far], s).mass_lb
      return 0
  }
}

export function kitWeight(o: CduKitOptions): Weight {
  const parts = kitBom(o).lines.map((l) => ({ label: l.label, lb: l.qty_per_unit * lineUnitMass(l, o) }))
  return { per_unit_lb: parts.reduce((s, p) => s + p.lb, 0), parts }
}

const FAR_LABEL: Record<CduKitOptions["far"], string> = { tc: "TC", fl150: "150# FLANGE", npt: "NPT", grv: "GROOVED" }

export function describeKit(o: CduKitOptions): string {
  const model = CDU_MODELS.find((m) => m.key === o.cdu)
  const port = isDnPort(o.port) ? `${o.port.toUpperCase()} HYGIENIC FLANGE` : `${sizeLabel(cduPortSize(o.port))} TC`
  const parts = [
    "CDU HOOKUP KIT",
    model && model.port ? model.label.toUpperCase() : "",
    `${port} PORTS`,
    o.side.toUpperCase(),
    `${o.run === "hard" ? "HARD PIPE" : "HOSE"} ${formatInches(o.len)} TO ${FAR_LABEL[o.far]}`,
    o.iso === "bfv" ? "BUTTERFLY VALVES" : o.iso === "bv" ? "BALL VALVES" : "",
    o.strainer === "none" ? "" : `${o.strainer.toUpperCase()} STRAINER`,
    o.gasket.toUpperCase(),
    alloyOf(o.alloy).label,
  ]
  return parts.filter((p) => p).join(", ")
}

export function kitDisplay(o: CduKitOptions) {
  const model = CDU_MODELS.find((m) => m.key === o.cdu)
  return [
    { label: "CDU", value: model && model.port ? model.label : "Not specified" },
    { label: "CDU port", value: isDnPort(o.port) ? `${o.port.toUpperCase()} hygienic flange` : `${sizeLabel(cduPortSize(o.port))} tri-clamp` },
    { label: "Loop", value: o.side === "tcs" ? "TCS (secondary, to the manifold)" : "FWS (primary, to the facility)" },
    { label: "Run", value: `${o.run === "hard" ? "Hard pipe (spool)" : "Braided hose"}, ${formatInches(o.len)}` },
    { label: "Far end", value: { tc: "Tri-clamp", fl150: "ANSI 150 flange", npt: "NPT", grv: "Grooved" }[o.far] },
    { label: "Isolation", value: { none: "None", bfv: "Butterfly valve", bv: "Ball valve" }[o.iso] },
    { label: "Strainer (supply)", value: { none: "None", short: "Short body", long: "Long body" }[o.strainer] },
    { label: "Gasket", value: { epdm: "EPDM (peroxide-cured)", sil: "Silicone", ptfe: "PTFE" }[o.gasket] },
    { label: "Spares", value: o.spares === "1" ? "+10% gaskets, 1 clamp" : "None" },
    { label: "Alloy", value: alloyOf(o.alloy).label },
    { label: "CDUs", value: String(o.units) },
  ]
}

export const CDU_KIT_BUILDER = makeBuilder<CduKitOptions>({
  type: "cdu-kit",
  path: "/build/cdu-kit",
  title: "CDU Hookup Kit",
  keys: CDU_KIT_KEYS,
  normalize: (o, ctx) => {
    let out = o
    // A known CDU fixes its port (B13); a contradicting port is reported.
    const model = CDU_MODELS.find((m) => m.key === o.cdu)
    if (model && model.port && out.port !== model.port) {
      if (ctx.present("port")) ctx.ignore("port")
      out = { ...out, port: model.port }
    }
    // Far end defaults by loop: TCS → tri-clamp, FWS → ANSI 150 flange.
    if (!ctx.given("far")) out = { ...out, far: out.side === "fws" ? "fl150" : "tc" }
    return out
  },
  cross: (o) => {
    const model = CDU_MODELS.find((m) => m.key === o.cdu)
    return model && model.port && model.port !== o.port
      ? [{ key: "port", message: `${model.label} has ${model.port} ports` }]
      : []
  },
  hasStep: false,
  partNumber: (o) => kitPartNumber(kitBom(o)),
  describe: describeKit,
  display: kitDisplay,
  weight: kitWeight,
  bom: kitBom,
  standardRange: checkKitRange,
  specBlock: kitSpecBlock,
})

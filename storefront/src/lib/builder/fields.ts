// Form fields of each builder, in the spec's input order. The value domain of every field comes
// from the shared KeySpec (lib/cpq/shared/option-keys.ts); this file only adds words: labels,
// option names and short help. Pure.

import { KEYS_BY_TYPE, CDU_MODELS, tubeSize, type BuilderType, type KeySpec } from "@lib/cpq/shared"

export type Choice = { value: string | number; label: string }

export type Field =
  | { key: string; label: string; help?: string; control: "select" | "segmented"; choices: Choice[] }
  | { key: string; label: string; help?: string; control: "number"; min: number; max: number; step: number; suffix?: string }
  | { key: string; label: string; help?: string; control: "toggle"; on: string; off: string }
  | { key: string; label: string; help?: string; control: "checks"; choices: Choice[] }

type Words = {
  label: string
  help?: string
  control?: Field["control"]
  names?: Record<string, string>
  suffix?: string
}

const sizeName = (code: number) => tubeSize(code).label

const ALLOY_WORDS: Words = { label: "Alloy", names: { t316l: "316L", t304l: "304L" }, control: "segmented" }

const WORDS: Record<BuilderType, Record<string, Words>> = {
  "cdu-kit": {
    cdu: {
      label: "Pick my CDU",
      help: "Known units, port read from the manufacturer's datasheet. More are added as datasheets are confirmed.",
      names: Object.fromEntries(CDU_MODELS.map((m) => [m.key, m.key === "none" ? "Not listed / enter the port" : m.label])),
    },
    port: {
      label: "CDU port connection",
      names: {
        tc100: '1" tri-clamp',
        tc150: '1.5" tri-clamp',
        tc200: '2" tri-clamp',
        tc300: '3" tri-clamp',
        tc400: '4" tri-clamp',
        dn50: "DN50 hygienic flange",
        dn80: "DN80 hygienic flange",
      },
    },
    side: {
      label: "Which loop",
      control: "segmented",
      names: { tcs: "TCS (secondary, to the manifold)", fws: "FWS (primary, to the facility)" },
    },
    run: { label: "Run type", control: "segmented", names: { hard: "Hard pipe (spool)", hose: "Flexible hose" } },
    far: {
      label: "Far-end connection",
      names: { tc: "Tri-clamp", fl150: "ANSI 150 flange", npt: "NPT", grv: "Grooved (adapter)" },
    },
    len: { label: "Length per run", help: "Hose length or spool face to face, 12–240 in.", suffix: "in" },
    iso: {
      label: "Isolation valves",
      help: "Sanitary tri-clamp ends, same size as the port.",
      names: { none: "None", bfv: "Butterfly valve", bv: "Ball valve" },
    },
    strainer: {
      label: "Strainer on supply",
      names: { none: "None", short: "316L inline, short body", long: "316L inline, long body" },
    },
    gasket: {
      label: "Gasket",
      help: "EPDM peroxide-cured is the default for water and PG25 glycol loops.",
      names: { epdm: "EPDM (peroxide-cured)", sil: "Silicone", ptfe: "PTFE" },
    },
    spares: { label: "Spares", control: "toggle", names: { "1": "+10% gaskets and 1 spare clamp", "0": "No spares" } },
    units: { label: "Number of CDUs", suffix: "CDUs" },
    alloy: ALLOY_WORDS,
  },
  "row-manifold": {
    header: { label: "Header OD", help: '4" is the most common data center header.' },
    drops: { label: "Number of drops", suffix: "drops" },
    pitch: { label: "Drop pitch (center to center)", suffix: "in" },
    drop: { label: "Drop size", control: "segmented", names: { "100": '1" (OCP default)', "150": '1.5"' } },
    dstyle: {
      label: "Drop style",
      names: { tc: "Tri-clamp ferrule", bv: "Sanitary branch with isolation ball valve", uqd: "UQD-ready stub (QD by others)" },
    },
    ends: { label: "Header ends", names: { tc: "Tri-clamp", fl150: "ANSI 150 flange", grv: "Grooved adapter", cap: "Capped" } },
    pair: { label: "Supply and return pair", control: "toggle", names: { "1": "Build as a pair", "0": "Single manifold" } },
    alloy: ALLOY_WORDS,
    finish: { label: "ID surface finish", control: "segmented", names: { "32": "32 Ra (standard)", "20": "20 Ra" } },
    fill: { label: "Fill, drain and vent", control: "toggle", names: { "1": '1" fill point, 0.5" drain, air vent', "0": "None" } },
    inst: { label: "Instrument ports", control: "toggle", names: { "1": '2 × 0.5" TC (temperature, pressure)', "0": "None" } },
    docs: {
      label: "Test and documentation",
      control: "checks",
      names: {
        hydro: "Hydrostatic test certificate",
        mtr: "MTRs by heat number",
        pass: "Passivation certificate (ASTM A380)",
        weldmap: "Weld map",
      },
    },
  },
  transition: {
    a: {
      label: "End A (CDU side)",
      names: { tc: "Tri-clamp", mil: "I-line male", fil: "I-line female", pbs: "Bevel seat (plain)", tbs: "Bevel seat (threaded)", bw: "Plain weld" },
    },
    b: {
      label: "End B (facility side)",
      names: {
        fl150: "ANSI 150 flange",
        fl300: "ANSI 300 flange",
        mnpt: "Male NPT",
        fnpt: "Female NPT",
        grv: "Grooved",
        bwp: "Butt-weld pipe adapter",
      },
    },
    od: { label: "Size A (tube OD)" },
    odb: { label: "Size B", help: "A different size adds a concentric reducer." },
    len: { label: "Overall length", help: "2–72 in, face to face.", suffix: "in" },
    alloy: ALLOY_WORDS,
    qty: { label: "Quantity", suffix: "pcs" },
  },
  strainer: {
    size: { label: "Size" },
    body: { label: "Body", control: "segmented", names: { short: "Short", long: "Long" } },
    mesh: { label: "Mesh", control: "segmented", names: { "20": "20 mesh", "40": "40 mesh", "100": "100 mesh" } },
    iso: { label: "Isolation valves either side", control: "toggle", names: { "1": "Add ball valves", "0": "None" } },
    dp: { label: "Differential-pressure ports", control: "toggle", names: { "1": "Add DP ports", "0": "None" } },
    qty: { label: "Quantity", suffix: "pcs" },
  },
  hose: {
    size: { label: "Size" },
    len: { label: "Length", help: "Stocked lengths: 24, 36, 48 and 72 in.", suffix: "in" },
    ends: { label: "Ends", names: { "tc-tc": "Tri-clamp both ends", "tc-npt": "Tri-clamp × male NPT", "tc-fl150": "Tri-clamp × ANSI 150 flange" } },
    cover: { label: "Cover", names: { braid: "Stainless overbraid", silicone: "Silicone", ptfe: "PTFE-lined" } },
    sleeve: { label: "Sleeve", control: "segmented", names: { none: "None", armor: "Armor", fire: "Fire" } },
    qty: { label: "Quantity", suffix: "pcs" },
  },
}

/** Field order per builder (the spec's input order); keys not listed follow in KeySpec order. */
const ORDER: Partial<Record<BuilderType, string[]>> = {
  "cdu-kit": ["cdu", "port", "side", "run", "far", "len", "iso", "strainer", "gasket", "alloy", "spares", "units"],
}

function fieldOf(spec: KeySpec, w: Words): Field {
  const name = (v: string | number) => w.names?.[String(v)] ?? (spec.type === "size" ? sizeName(Number(v)) : String(v))
  switch (spec.type) {
    case "enum": {
      if (w.control === "toggle") {
        return { key: spec.key, label: w.label, help: w.help, control: "toggle", on: name("1"), off: name("0") }
      }
      const choices = spec.values.map((v) => ({ value: v, label: name(v) }))
      const control = w.control === "segmented" ? "segmented" : "select"
      return { key: spec.key, label: w.label, help: w.help, control, choices }
    }
    case "size": {
      const choices = spec.values.map((v) => ({ value: v, label: name(v) }))
      return { key: spec.key, label: w.label, help: w.help, control: w.control === "segmented" ? "segmented" : "select", choices }
    }
    case "list":
      return { key: spec.key, label: w.label, help: w.help, control: "checks", choices: spec.values.map((v) => ({ value: v, label: name(v) })) }
    case "int":
      return { key: spec.key, label: w.label, help: w.help, control: "number", min: spec.min, max: spec.max, step: 1, suffix: w.suffix }
    case "inches":
      return { key: spec.key, label: w.label, help: w.help, control: "number", min: spec.min, max: spec.max, step: 0.125, suffix: w.suffix }
  }
}

export function fieldsFor(type: BuilderType): Field[] {
  const keys = KEYS_BY_TYPE[type]
  const order = ORDER[type] ?? keys.map((k) => k.key)
  const rest = keys.map((k) => k.key).filter((k) => order.indexOf(k) < 0)
  return [...order, ...rest].map((key) => {
    const spec = keys.find((k) => k.key === key)!
    const w = WORDS[type][key] ?? { label: key }
    return fieldOf(spec, w)
  })
}

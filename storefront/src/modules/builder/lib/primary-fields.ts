// Primary questions vs the collapsed "Options" section (David's review, Oct 20): each builder asks
// at most a few questions up front; every other field sits under one collapsed Options section with
// its default preselected, and the collapsed header summarizes the current choices. Pure; unit-tested
// in __tests__/primary-fields.test.ts.
//
// The split lives here, not in lib/builder/fields.ts (the field words), so either file can change
// without the other. When fields.ts grows a `primary: true` flag, `splitFields` can read it instead.

import { CDU_MODELS, type BuilderType, type Options } from "@lib/cpq/shared"
import { sizeLabel } from "./result-summary"
import type { Choice, Field } from "@lib/builder/fields"

/**
 * Primary keys per builder, in display order. CDU kit: "cdu" is the combined "Pick my CDU or the
 * port" control (it also owns `port`, which never appears under Options).
 */
export const PRIMARY_KEYS: Record<BuilderType, readonly string[]> = {
  "cdu-kit": ["cdu", "far", "units"],
  "row-manifold": ["header", "drops", "pitch"],
  transition: ["a", "b", "od", "qty"],
  strainer: ["size", "mesh", "qty"],
  hose: ["size", "len", "ends", "qty"],
}

/** Keys folded into a primary control (never listed under Options). */
const FOLDED_KEYS: Partial<Record<BuilderType, readonly string[]>> = {
  "cdu-kit": ["port"],
}

export type FieldSplit = { primary: Field[]; advanced: Field[] }

export function isPrimaryKey(type: BuilderType, key: string): boolean {
  return PRIMARY_KEYS[type].includes(key) || (FOLDED_KEYS[type] ?? []).includes(key)
}

/** Splits a builder's fields: primary in PRIMARY_KEYS order, the rest (in field order) under Options. */
export function splitFields(type: BuilderType, fields: readonly Field[]): FieldSplit {
  const byKey = new Map(fields.map((f) => [f.key, f]))
  const primary = PRIMARY_KEYS[type].map((k) => byKey.get(k)).filter((f): f is Field => !!f)
  const advanced = fields.filter((f) => !isPrimaryKey(type, f.key))
  return { primary, advanced }
}

// ------------------------------------------------------------------- CDU picker (kit, primary)

/** One select for "Pick my CDU" OR the port: known models (port pre-filled) first, then the ports. */
export type CduPickerGroup = { label: string; choices: Choice[] }

export function cduPickerGroups(fields: readonly Field[]): CduPickerGroup[] {
  const cdu = fields.find((f) => f.key === "cdu")
  const port = fields.find((f) => f.key === "port")
  const names = (f: Field | undefined) => (f && "choices" in f ? f.choices : [])
  const models = names(cdu).filter((c) => {
    const m = CDU_MODELS.find((x) => x.key === c.value)
    return !!m && !!m.port
  })
  const portName = (v: string | number) => names(port).find((c) => String(c.value) === String(v))?.label ?? String(v)
  const groups: CduPickerGroup[] = []
  if (models.length) {
    groups.push({
      label: "My CDU",
      choices: models.map((c) => {
        const m = CDU_MODELS.find((x) => x.key === c.value)!
        return { value: `cdu:${c.value}`, label: `${c.label} (${portName(m.port as string)})` }
      }),
    })
  }
  groups.push({ label: "Or the port size", choices: names(port).map((c) => ({ value: `port:${c.value}`, label: c.label })) })
  return groups
}

/** The picker's current value: the model when one is chosen, otherwise the port. */
export function cduPickerValue(options: Options): string {
  const model = CDU_MODELS.find((m) => m.key === options.cdu)
  return model && model.port ? `cdu:${model.key}` : `port:${String(options.port)}`
}

/** The option change a picker value stands for. */
export function cduPickerChange(value: string): { key: "cdu" | "port"; value: string } | null {
  const m = /^(cdu|port):(.+)$/.exec(value)
  return m ? { key: m[1] as "cdu" | "port", value: m[2] } : null
}

// ------------------------------------------------------------------- Options summary

const ALLOY_SHORT = { t316l: "316L", t304l: "304L" }
const inches = (v: unknown) => `${Number(v)}"`
const size = (v: unknown) => sizeLabel(v)

/**
 * Short words per advanced key for the collapsed header. A string map gives the token per value;
 * a value mapped to "" is left out (an "off" that needs no mention). A function gets the options.
 */
type Short = Record<string, string> | ((v: unknown, o: Options) => string)

const SHORT: Record<BuilderType, Record<string, Short>> = {
  "cdu-kit": {
    side: { tcs: "TCS", fws: "FWS" },
    run: { hard: "spool", hose: "hose" },
    len: (v) => inches(v),
    iso: { none: "no valves", bfv: "butterfly valves", bv: "ball valves" },
    strainer: { none: "", short: "short strainer", long: "long strainer" },
    gasket: { epdm: "EPDM", sil: "silicone", ptfe: "PTFE" },
    alloy: ALLOY_SHORT,
    spares: { "0": "", "1": "+ spares" },
  },
  "row-manifold": {
    drop: { "100": '1" drops', "150": '1.5" drops' },
    dstyle: { tc: "TC drops", bv: "valved drops", uqd: "UQD stubs" },
    ends: { tc: "TC ends", fl150: "150# ends", grv: "grooved ends", cap: "capped ends" },
    pair: { "1": "S+R pair", "0": "single" },
    alloy: ALLOY_SHORT,
    finish: { "32": "32 Ra", "20": "20 Ra" },
    fill: { "1": "fill/drain/vent", "0": "" },
    inst: { "1": "instrument ports", "0": "" },
    docs: (v) => {
      const n: Record<string, string> = { hydro: "hydro", mtr: "MTRs", pass: "passivation", weldmap: "weld map" }
      const list = Array.isArray(v) ? v.map((x) => n[String(x)] ?? String(x)) : []
      return list.length ? list.join(" + ") : "no docs"
    },
  },
  transition: {
    odb: (v, o) => (Number(v) === Number(o.od) ? "" : `reducing to ${size(v)}`),
    len: (v) => inches(v),
    alloy: ALLOY_SHORT,
  },
  strainer: {
    body: { short: "short body", long: "long body" },
    iso: { "1": "ball valves", "0": "" },
    dp: { "1": "DP ports", "0": "" },
  },
  hose: {
    cover: { braid: "overbraid", silicone: "silicone", ptfe: "PTFE-lined" },
    sleeve: { none: "", armor: "armor", fire: "fire sleeve" },
  },
}

function fallbackToken(f: Field, v: unknown): string {
  switch (f.control) {
    case "select":
    case "segmented":
      return f.choices.find((c) => String(c.value) === String(v))?.label ?? String(v)
    case "toggle":
      return String(v) === "1" ? f.on : ""
    case "checks":
      return Array.isArray(v) ? v.join(" + ") : ""
    case "number":
      return `${v}${f.suffix ? ` ${f.suffix}` : ""}`
  }
}

/** The collapsed Options header's tokens: "TCS", "hose", "36\"", "no valves", "EPDM", "316L". */
export function optionsSummaryTokens(type: BuilderType, options: Options, advanced: readonly Field[]): string[] {
  return advanced
    .map((f) => {
      const s = SHORT[type][f.key]
      const v = options[f.key]
      if (typeof s === "function") return s(v, options)
      if (s) return s[String(v)] ?? fallbackToken(f, v)
      return fallbackToken(f, v)
    })
    .filter((t) => t.trim() !== "")
}

/** "TCS · hose · 36\" · no valves · EPDM · 316L" */
export function optionsSummary(type: BuilderType, options: Options, advanced: readonly Field[]): string {
  return optionsSummaryTokens(type, options, advanced).join(" · ")
}

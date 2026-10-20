import { describe, expect, it } from "vitest"
import { DEFAULT_CDU_KIT_OPTIONS, DEFAULT_ROW_MANIFOLD_OPTIONS, type BuilderType, type Options } from "@lib/cpq/shared"
import { fieldsFor } from "@lib/builder/fields"
import { applyOptionChange } from "@lib/builder/state"
import {
  cduPickerChange,
  cduPickerGroups,
  cduPickerValue,
  optionsSummary,
  PRIMARY_KEYS,
  splitFields,
} from "../primary-fields"

const keys = (fs: { key: string }[]) => fs.map((f) => f.key)

describe("splitFields", () => {
  it("CDU kit: three questions up front, everything else under Options, port folded into the CDU picker", () => {
    const { primary, advanced } = splitFields("cdu-kit", fieldsFor("cdu-kit"))
    expect(keys(primary)).toEqual(["cdu", "far", "units"])
    expect(keys(advanced)).toEqual(expect.arrayContaining(["side", "run", "len", "iso", "strainer", "gasket", "alloy", "spares"]))
    expect(keys(advanced)).not.toContain("port")
    expect(keys(advanced)).not.toContain("units")
  })

  it.each([
    ["row-manifold", ["header", "drops", "pitch"]],
    ["transition", ["a", "b", "od", "qty"]],
    ["strainer", ["size", "mesh", "qty"]],
    ["hose", ["size", "len", "ends", "qty"]],
  ] as [BuilderType, string[]][])("%s primary fields", (type, want) => {
    const all = fieldsFor(type)
    const { primary, advanced } = splitFields(type, all)
    expect(keys(primary)).toEqual(want)
    // Every field lands exactly once.
    expect([...keys(primary), ...keys(advanced)].sort()).toEqual(keys(all).sort())
  })

  it("every primary key is a real field", () => {
    for (const type of Object.keys(PRIMARY_KEYS) as BuilderType[]) {
      const all = keys(fieldsFor(type))
      for (const k of PRIMARY_KEYS[type]) expect(all).toContain(k)
    }
  })
})

describe("CDU picker", () => {
  const fields = fieldsFor("cdu-kit")
  it("lists the known models (with their port) before the ports", () => {
    const groups = cduPickerGroups(fields)
    expect(groups[0].choices[0]).toEqual({ value: "cdu:boyd-10u", label: 'Boyd 10U CDU (1.5" tri-clamp)' })
    expect(groups[groups.length - 1].choices.map((c) => c.value)).toContain("port:tc200")
  })
  it("value and change round-trip through applyOptionChange", () => {
    const o = DEFAULT_CDU_KIT_OPTIONS as unknown as Options
    expect(cduPickerValue(o)).toBe("port:tc150")
    const pick = cduPickerChange("cdu:boyd-10u")!
    const res = applyOptionChange("cdu-kit", o, pick.key, pick.value)
    expect(res.ok && cduPickerValue(res.options)).toBe("cdu:boyd-10u")
    const port = cduPickerChange("port:tc200")!
    const res2 = res.ok ? applyOptionChange("cdu-kit", res.options, port.key, port.value) : null
    expect(res2?.ok && res2.options.cdu).toBe("none")
    expect(res2?.ok && cduPickerValue(res2.options)).toBe("port:tc200")
  })
})

describe("optionsSummary", () => {
  it("summarizes the kit's Options like the review asked", () => {
    const { advanced } = splitFields("cdu-kit", fieldsFor("cdu-kit"))
    const o = { ...DEFAULT_CDU_KIT_OPTIONS, run: "hose" } as unknown as Options
    expect(optionsSummary("cdu-kit", o, advanced)).toBe('TCS · hose · 36" · no valves · EPDM · 316L')
    const more = { ...o, iso: "bv", strainer: "short", spares: "1", alloy: "t304l" } as unknown as Options
    expect(optionsSummary("cdu-kit", more, advanced)).toBe('TCS · hose · 36" · ball valves · short strainer · EPDM · 304L · + spares')
  })
  it("manifold: leaves out what is off", () => {
    const { advanced } = splitFields("row-manifold", fieldsFor("row-manifold"))
    const s = optionsSummary("row-manifold", DEFAULT_ROW_MANIFOLD_OPTIONS as unknown as Options, advanced)
    expect(s).toContain('1" drops')
    expect(s).toContain("hydro + MTRs")
    expect(s).not.toContain("instrument ports")
  })
})

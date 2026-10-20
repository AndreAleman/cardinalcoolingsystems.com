import { describe, expect, it } from "vitest"
import { BUILDER_TYPES, KEYS_BY_TYPE } from "@lib/cpq/shared"
import { fieldsFor, type Field } from "../fields"

const field = (type: Parameters<typeof fieldsFor>[0], key: string): Field => fieldsFor(type).find((f) => f.key === key)!

describe("builder fields", () => {
  it("every key has a field, and every enum value a written name", () => {
    for (const t of BUILDER_TYPES) {
      const fields = fieldsFor(t)
      expect(fields.map((f) => f.key).sort()).toEqual(KEYS_BY_TYPE[t].map((k) => k.key).sort())
      for (const f of fields) {
        if (f.control !== "select" && f.control !== "segmented" && f.control !== "checks") continue
        for (const c of f.choices) expect(c.label).not.toBe(String(c.value).replace(/^0+/, ""))
      }
    }
  })

  it("spares: the unchecked toggle still offers the spares", () => {
    const f = field("cdu-kit", "spares")
    expect(f).toMatchObject({
      control: "toggle",
      on: "+10% gaskets and 1 spare clamp per CDU",
      off: "Add +10% gaskets and 1 spare clamp per CDU",
    })
  })

  it("CDU picker: Vertiv CoolChip CDU 600 with its 2-1/2\" sanitary port", () => {
    const cdu = field("cdu-kit", "cdu")
    if (cdu.control !== "select") throw new Error("cdu is a select")
    expect(cdu.choices.find((c) => c.value === "vertiv-cdu-600")?.label).toBe('Vertiv CoolChip CDU 600 (2-1/2" sanitary)')
    const port = field("cdu-kit", "port")
    if (port.control !== "select") throw new Error("port is a select")
    expect(port.choices.find((c) => c.value === "tc250")?.label).toBe('2.5" tri-clamp')
  })

  it("run: hose (the default) is offered first", () => {
    const run = field("cdu-kit", "run")
    if (run.control !== "segmented") throw new Error("run is segmented")
    expect(run.choices.map((c) => c.value)).toEqual(["hose", "hard"])
  })
})

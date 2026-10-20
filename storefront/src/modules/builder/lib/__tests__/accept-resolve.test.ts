import { describe, expect, it } from "vitest"
import { getBuilder } from "@lib/cpq/shared"
import type { ResolveResponse } from "@lib/builder/types"
import { acceptResolve } from "../accept-resolve"

const kit = getBuilder("cdu-kit")

function response(config_key: string): ResolveResponse {
  return { config_key, part_number: "PN", bom: [], spec_block: "" } as unknown as ResolveResponse
}

describe("acceptResolve", () => {
  it("accepts a response for the requested configuration", () => {
    const key = kit.configKey(kit.decode(null).options)
    const res = response(key)
    expect(acceptResolve(key, { ok: true, data: res })).toEqual({ status: "done", result: res })
  })

  it("treats another configuration's response as an error (version skew reset an option)", () => {
    const asked = kit.configKey({ ...kit.decode(null).options, alloy: "t304l" })
    const answered = kit.configKey({ ...kit.decode(null).options, alloy: "t316l" })
    expect(asked).not.toBe(answered)
    expect(acceptResolve(asked, { ok: true, data: response(answered) })).toEqual({ status: "error", result: null })
  })

  it("passes a failed action through as an error", () => {
    expect(acceptResolve("k", { ok: false })).toEqual({ status: "error", result: null })
  })
})

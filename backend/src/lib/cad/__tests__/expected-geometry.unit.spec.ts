// The `expected` block the backend sends cad-service must equal the golden fixtures' `expected` for
// every transition and manifold vector (the same files the Python golden test reads), and the
// PDF-only builders send none.

import fs from "node:fs"
import path from "node:path"
import { getBuilder } from "../../cpq-shared"
import { expectedGeometry } from "../ensure-package"

const FIXTURES = path.resolve(__dirname, "../../../../../shared/cpq/fixtures")

type Golden = { tolerance: number; vectors: { name: string; input: Record<string, any>; expected: unknown }[] }
const load = (file: string): Golden => JSON.parse(fs.readFileSync(path.join(FIXTURES, file), "utf8"))

/** Same keys, numbers within tol, everything else equal. Returns the first mismatch path. */
function mismatch(actual: unknown, expected: unknown, tol: number, at = "$"): string | null {
  if (typeof expected === "number") {
    return typeof actual === "number" && Math.abs(actual - expected) <= tol ? null : `${at}: ${actual} != ${expected}`
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return `${at}: length`
    for (let i = 0; i < expected.length; i++) {
      const m = mismatch(actual[i], expected[i], tol, `${at}[${i}]`)
      if (m) return m
    }
    return null
  }
  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object") return `${at}: not an object`
    const ek = Object.keys(expected).sort()
    const ak = Object.keys(actual as object).sort()
    if (JSON.stringify(ek) !== JSON.stringify(ak)) return `${at}: keys ${ak} != ${ek}`
    for (const k of ek) {
      const m = mismatch((actual as any)[k], (expected as any)[k], tol, `${at}.${k}`)
      if (m) return m
    }
    return null
  }
  return actual === expected ? null : `${at}: ${String(actual)} != ${String(expected)}`
}

for (const [file, type] of [
  ["transition-golden.json", "transition"],
  ["manifold-golden.json", "row-manifold"],
] as const) {
  describe(`expectedGeometry vs ${file}`, () => {
    const golden = load(file)
    it("has vectors", () => expect(golden.vectors.length).toBeGreaterThanOrEqual(3))
    it.each(golden.vectors.map((v) => [v.name, v] as const))("%s", (_name, v) => {
      expect(mismatch(expectedGeometry(type, v.input as any), v.expected, golden.tolerance)).toBeNull()
    })
  })
}

describe("PDF-only builders (plan B8)", () => {
  it.each(["cdu-kit", "strainer", "hose"] as const)("%s sends no expected block", (type) => {
    expect(getBuilder(type).hasStep).toBe(false)
    expect(expectedGeometry(type, getBuilder(type).defaults as any)).toBeUndefined()
  })
  it("transition and manifold do", () => {
    expect(expectedGeometry("transition", getBuilder("transition").defaults as any)).toMatchObject({ overallLength: 12 })
    expect(expectedGeometry("row-manifold", getBuilder("row-manifold").defaults as any)).toMatchObject({ drops: 12 })
  })
})

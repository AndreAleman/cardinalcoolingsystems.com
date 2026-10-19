// The backend's CAD_GENERATOR_VERSION is part of the cache key computed before cad-service is
// called, so it must equal cad-service/app/version.py GENERATOR_VERSION. Python's test_version.py
// checks the other direction. Skips when the cad-service tree is absent.

import fs from "node:fs"
import path from "node:path"
import { CAD_GENERATOR_VERSION, cadCacheKey, cadObjectKeys } from "../cache-key"
import { CPQ_TABLES_HASH } from "../../cpq-shared"

const VERSION_PY = path.resolve(__dirname, "../../../../../cad-service/app/version.py")
const MANIFEST = path.resolve(__dirname, "../../../../../cad-service/cpq_shared/MANIFEST.json")
const present = fs.existsSync(VERSION_PY)

;(present ? describe : describe.skip)("CAD generator version parity", () => {
  it("backend CAD_GENERATOR_VERSION == cad-service GENERATOR_VERSION", () => {
    const m = /^GENERATOR_VERSION\s*=\s*["']([^"']+)["']/m.exec(fs.readFileSync(VERSION_PY, "utf8"))
    expect(m).not.toBeNull()
    expect(CAD_GENERATOR_VERSION).toBe(m![1])
  })
  it("cad-service's synced tables hash == the backend's CPQ_TABLES_HASH", () => {
    expect(JSON.parse(fs.readFileSync(MANIFEST, "utf8")).tables_hash).toBe(CPQ_TABLES_HASH)
  })
})

describe("CAD cache key", () => {
  it("is generator 1, and every version is part of the key and the object keys", () => {
    expect(CAD_GENERATOR_VERSION).toBe("1")
    expect(cadCacheKey("clmp-fl150-tspool-l12-6-200")).toBe(`clmp-fl150-tspool-l12-6-200@${CPQ_TABLES_HASH}-g1-d1`)
    expect(cadObjectKeys("kit-cdu-a5ad698f")).toEqual({
      step: `cad/kit-cdu-a5ad698f/${CPQ_TABLES_HASH}-g1-d1.step`,
      pdf: `cad/kit-cdu-a5ad698f/${CPQ_TABLES_HASH}-g1-d1.pdf`,
    })
  })
})

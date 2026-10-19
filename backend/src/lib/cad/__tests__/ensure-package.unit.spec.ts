import crypto from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { CPQ_TABLES_HASH, getBuilder, TRANSITION_BUILDER } from "../../cpq-shared"
import { cadCacheKey, cadObjectKeys } from "../cache-key"
import { createFsCadStore } from "../cad-store"
import { ensureCadPackage, ensurePackageForRequest, type EnsureCadPackageDeps } from "../ensure-package"
import { CAD_LOGO_HREF, renderDrawingSvg } from "../render-drawing"
import { FakeCadService } from "./fake-cad-service"

const file = (text: string) => {
  const buf = Buffer.from(text)
  return { filename: "x", content_type: "x", bytes: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex"), base64: buf.toString("base64") }
}

function setup() {
  const service = new FakeCadService()
  const container = { resolve: () => service as any }
  const store = createFsCadStore(fs.mkdtempSync(path.join(os.tmpdir(), "cad-store-")))
  const generate = jest.fn(async (builderType: string, input: any) => {
    await new Promise((r) => setTimeout(r, 10))
    const hasStep = getBuilder(builderType).hasStep
    return {
      part_number: input.part_number,
      generator_version: "1",
      tables_hash: input.tables_hash,
      step: hasStep ? file("ISO-10303-21;") : null,
      pdf: file("%PDF-1.7"),
    }
  })
  const render = jest.fn(() => "<svg/>")
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  const deps: EnsureCadPackageDeps = { store, generate: generate as any, render, logger }
  return { service, container, store, generate, render, deps, logger }
}

const T = { ...TRANSITION_BUILDER.defaults, len: 20 }
const PN = TRANSITION_BUILDER.partNumber(T)
const input = (over: Record<string, unknown> = {}) => ({ builderType: "transition" as const, options: T, partNumber: PN, ...over })

describe("ensureCadPackage", () => {
  it("generates once, stores both files, marks the row ready (transition)", async () => {
    const { service, container, store, generate, render, deps } = setup()
    const pkg = await ensureCadPackage(container, input({ countAgainstCap: true, capDay: "2026-10-16" }), deps)
    expect(pkg).toMatchObject({ status: "ready", cache_key: cadCacheKey(PN), counted_against_cap: true, tables_hash: CPQ_TABLES_HASH })
    const keys = cadObjectKeys(PN)
    expect(pkg.step_key).toBe(keys.step)
    expect(await store.exists(keys.step)).toBe(true)
    expect(await store.exists(keys.pdf)).toBe(true)
    expect(pkg.step_bytes).toBe("ISO-10303-21;".length)
    expect(generate.mock.calls[0][0]).toBe("transition")
    const sent = generate.mock.calls[0][1] as any
    expect(Object.keys(sent).sort()).toEqual(["config", "description", "drawing_svg", "expected", "part_number", "tables_hash"])
    expect(sent.config).toEqual(T)
    expect(sent.expected).toEqual(TRANSITION_BUILDER.expected!(T))
    expect(sent.description).toBe(TRANSITION_BUILDER.describe(T))
    expect((render.mock.calls[0] as any[]).slice(0, 3)).toEqual(["transition", T, PN])
    expect(service.packages[0]).toMatchObject({ builder_type: "transition", configuration: T })

    await ensureCadPackage(container, input(), deps)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("PDF-only builders: no expected sent, no STEP required or stored", async () => {
    const { container, store, generate, deps } = setup()
    for (const type of ["cdu-kit", "strainer", "hose"] as const) {
      const b = getBuilder(type)
      const pn = b.partNumber(b.defaults)
      const pkg = await ensureCadPackage(container, { builderType: type, options: b.defaults, partNumber: pn }, deps)
      expect(pkg).toMatchObject({ status: "ready", builder_type: type, step_key: null, step_bytes: null, pdf_key: cadObjectKeys(pn).pdf })
      expect(await store.exists(cadObjectKeys(pn).step)).toBe(false)
      expect("expected" in (generate.mock.calls.at(-1)![1] as any)).toBe(false)
    }
  })

  it("concurrent calls for one cache key make one service call", async () => {
    const { container, generate, deps, service } = setup()
    const results = await Promise.all(Array.from({ length: 5 }, () => ensureCadPackage(container, input(), deps)))
    expect(generate).toHaveBeenCalledTimes(1)
    expect(new Set(results.map((r) => r.id)).size).toBe(1)
    expect(service.packages).toHaveLength(1)
  })

  it("a failure marks the row failed and rethrows; a retry reuses the row", async () => {
    const { container, generate, deps, service } = setup()
    generate.mockRejectedValueOnce(new Error("geometry_mismatch"))
    await expect(ensureCadPackage(container, input(), deps)).rejects.toThrow("geometry_mismatch")
    expect(service.packages[0]).toMatchObject({ status: "failed", error: "geometry_mismatch" })
    const pkg = await ensureCadPackage(container, input(), deps)
    expect(pkg).toMatchObject({ status: "ready", error: null })
    expect(service.packages).toHaveLength(1)
  })

  it("rejects a corrupted file, a missing STEP for a STEP kind, and pdf: null", async () => {
    for (const bad of [
      { step: { ...file("a"), sha256: "deadbeef" }, pdf: file("%PDF"), msg: "sha256" },
      { step: null, pdf: file("%PDF"), msg: "no STEP file" },
      { step: file("ISO"), pdf: null, msg: "no PDF file" },
    ]) {
      const { container, generate, deps, service } = setup()
      generate.mockResolvedValueOnce({ part_number: PN, generator_version: "1", tables_hash: "x", step: bad.step, pdf: bad.pdf } as any)
      await expect(ensureCadPackage(container, input(), deps)).rejects.toThrow(bad.msg)
      expect(service.packages[0].status).toBe("failed")
    }
  })

  it("takes over a slot reserved by admission without changing its cap flags", async () => {
    const { container, deps, service } = setup()
    service.addPackage({ part_number: PN, cache_key: cadCacheKey(PN), status: "generating", counted_against_cap: true, cap_day: "2026-10-16" })
    const pkg = await ensurePackageForRequest(container, { builder_type: "transition", part_number: PN, configuration: T as any }, {}, deps)
    expect(pkg).toMatchObject({ status: "ready", counted_against_cap: true, cap_day: "2026-10-16" })
    expect(service.packages).toHaveLength(1)
  })

  it("ensurePackageForRequest refuses stored options that no longer validate, or an unknown type", async () => {
    const { container, deps } = setup()
    await expect(ensurePackageForRequest(container, { builder_type: "transition", part_number: "x", configuration: { od: 999 } }, {}, deps)).rejects.toThrow("no longer validates")
    await expect(ensurePackageForRequest(container, { builder_type: "sweep", part_number: "x", configuration: {} }, {}, deps)).rejects.toThrow("no longer validates")
  })

  it("refuses an unsafe Part Number", async () => {
    const { container, deps } = setup()
    await expect(ensureCadPackage(container, input({ partNumber: "../etc" }), deps)).rejects.toThrow("Invalid Part Number")
  })

  it("warns when cad-service reports another generator version", async () => {
    const { container, generate, deps, logger } = setup()
    generate.mockResolvedValueOnce({ part_number: PN, generator_version: "9", tables_hash: CPQ_TABLES_HASH, step: file("ISO"), pdf: file("%PDF") } as any)
    const pkg = await ensureCadPackage(container, input(), deps)
    expect(pkg.generator_version).toBe("9")
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("generator_version 9 != backend CAD_GENERATOR_VERSION 1"))
  })
})

describe("renderDrawingSvg", () => {
  it.each(["transition", "row-manifold", "cdu-kit", "strainer", "hose"] as const)("%s: print sheet with the backend logo and the Part Number", (type) => {
    const b = getBuilder(type)
    const pn = b.partNumber(b.defaults)
    const svg = renderDrawingSvg(type, b.defaults, pn, "10/18/2026")
    expect(svg.startsWith("<svg")).toBe(true)
    expect(svg).toContain('width="17in" height="11in"')
    expect(svg).toContain(`href="${CAD_LOGO_HREF}"`)
    expect(CAD_LOGO_HREF).toBe("cardinal-logo.svg")
    expect(svg).toContain(`>${pn}</text>`)
  })

  it("renders byte-identical to the committed transition sheet golden", () => {
    const golden = fs.readFileSync(path.resolve(__dirname, "../../../../../shared/cpq/fixtures/transition-sheet-golden.svg"), "utf8")
    const o = TRANSITION_BUILDER.defaults
    expect(renderDrawingSvg("transition", o, TRANSITION_BUILDER.partNumber(o), "10/18/2026")).toBe(golden.replace(/\n$/, ""))
  })
})

describe("Medusa 2.8 update*() returns an array", () => {
  it("claiming a reserved row and marking it ready still works", async () => {
    const { service, container, deps } = setup()
    const realUpdate = service.updateCadPackages.bind(service)
    service.updateCadPackages = (async (data: any) => [await realUpdate(data)]) as any
    service.addPackage({ part_number: PN, cache_key: cadCacheKey(PN), status: "generating", counted_against_cap: true, cap_day: "2026-10-18" })
    const pkg = await ensureCadPackage(container, input(), deps)
    expect(pkg).toMatchObject({ status: "ready", counted_against_cap: true })
    expect(service.packages[0].status).toBe("ready")
  })
})

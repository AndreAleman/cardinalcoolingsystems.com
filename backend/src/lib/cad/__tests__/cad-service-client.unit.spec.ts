import { TRANSITION_BUILDER } from "../../cpq-shared"
import {
  CadServiceError,
  cadServiceEnabled,
  generatePackage,
  getCadServiceHealth,
  packagePath,
  type PackageRequest,
} from "../cad-service-client"

const INPUT: PackageRequest = {
  part_number: "clmp-fl150-tspool-l12-6-200",
  config: { ...TRANSITION_BUILDER.defaults },
  tables_hash: "abc",
  drawing_svg: "<svg/>",
  description: "x",
  expected: { overallLength: 12, tubeStraight: 9 },
}

const OK_BODY = { part_number: INPUT.part_number, generator_version: "1", tables_hash: "abc", step: {}, pdf: {} }

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) }
}

describe("cad-service client", () => {
  const env = { ...process.env }
  beforeEach(() => {
    process.env.CAD_SERVICE_URL = "http://cad.test:8080/"
    process.env.CAD_SERVICE_TOKEN = "tok"
  })
  afterEach(() => {
    process.env = { ...env }
  })

  it("is enabled only with both URL and token", () => {
    expect(cadServiceEnabled()).toBe(true)
    delete process.env.CAD_SERVICE_TOKEN
    expect(cadServiceEnabled()).toBe(false)
  })

  it("maps every builder to its route and refuses unknown types", () => {
    for (const t of ["transition", "row-manifold", "cdu-kit", "strainer", "hose"]) {
      expect(packagePath(t)).toBe(`/v1/packages/${t}`)
    }
    expect(() => packagePath("sweep")).toThrow(CadServiceError)
  })

  it("posts the envelope to /v1/packages/transition with the bearer token", async () => {
    const fetch = jest.fn().mockResolvedValue(response(200, OK_BODY))
    const res = await generatePackage("transition", INPUT, { fetch })
    expect(res.generator_version).toBe("1")
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe("http://cad.test:8080/v1/packages/transition")
    expect(init.headers.authorization).toBe("Bearer tok")
    const body = JSON.parse(init.body)
    // cad-service forbids extra keys.
    expect(Object.keys(body).sort()).toEqual(["config", "description", "drawing_svg", "expected", "part_number", "tables_hash"])
    expect(body.config).toEqual({ ...TRANSITION_BUILDER.defaults })
  })

  it("a PDF-only kind posts without `expected`", async () => {
    const fetch = jest.fn().mockResolvedValue(response(200, { ...OK_BODY, step: null }))
    const { expected: _e, ...noExpected } = INPUT
    await generatePackage("hose", noExpected, { fetch })
    expect(fetch.mock.calls[0][0]).toBe("http://cad.test:8080/v1/packages/hose")
    expect("expected" in JSON.parse(fetch.mock.calls[0][1].body)).toBe(false)
  })

  it("retries once on 503", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response(503, { error: { code: "warming_up", message: "cold" } }))
      .mockResolvedValueOnce(response(200, OK_BODY))
    await generatePackage("transition", INPUT, { fetch, retryDelayMs: 0 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("retries once on ECONNREFUSED, then gives up", async () => {
    const err = Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } })
    const fetch = jest.fn().mockRejectedValue(err)
    await expect(generatePackage("transition", INPUT, { fetch, retryDelayMs: 0 })).rejects.toMatchObject({ code: "ECONNREFUSED", status: 0 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("does not retry on 422 and surfaces the service error code", async () => {
    const fetch = jest.fn().mockResolvedValue(response(422, { error: { code: "geometry_mismatch", message: "tubeStraight" } }))
    const p = generatePackage("transition", INPUT, { fetch, retryDelayMs: 0 })
    await expect(p).rejects.toBeInstanceOf(CadServiceError)
    await expect(p).rejects.toMatchObject({ status: 422, code: "geometry_mismatch" })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("times out (no retry)", async () => {
    const fetch = jest.fn((_url: string, init: any) => {
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))
      })
    })
    await expect(generatePackage("transition", INPUT, { fetch: fetch as any, timeoutMs: 20 })).rejects.toMatchObject({ code: "timeout" })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("refuses when not configured", async () => {
    delete process.env.CAD_SERVICE_URL
    await expect(generatePackage("transition", INPUT, { fetch: jest.fn() })).rejects.toMatchObject({ code: "disabled" })
  })

  it("health never throws", async () => {
    const ok = await getCadServiceHealth({
      fetch: jest.fn().mockResolvedValue(response(200, { ok: true, generator_version: "1", tables_hash: "abc" })),
    })
    expect(ok).toEqual({ enabled: true, healthy: true, generator_version: "1", tables_hash: "abc" })
    const down = await getCadServiceHealth({ fetch: jest.fn().mockRejectedValue(new Error("down")) })
    expect(down.healthy).toBe(false)
    const off = await getCadServiceHealth({ env: {} as any, fetch: jest.fn() })
    expect(off).toEqual({ enabled: false, healthy: false, generator_version: null, tables_hash: null })
  })
})

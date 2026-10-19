// The store route's pure pieces: options parsing, the CAD client-IP trust rule, the honeypot and
// Turnstile middlewares (visitors only), and the body validator.

import { getBuilder } from "../../../../lib/cpq-shared"
import { parseBuilderOptions } from "../../../../lib/cad/builder-options"
import { cadClientIp, honeypotResponse } from "../helpers"
import { cadHoneypot, cadTurnstile } from "../middlewares"
import { StoreCreateCadRequest } from "../validators"

describe("parseBuilderOptions", () => {
  it("accepts the canonical options object and URL-style strings, filling defaults", () => {
    const t = getBuilder("transition")
    const a = parseBuilderOptions("transition", { a: "tc", b: "fl150", od: 200, len: 12 }) as any
    expect(a.ok).toBe(true)
    expect(a.value.options).toEqual(t.defaults)
    const b = parseBuilderOptions("transition", { od: "300", odb: "200", b: "grv", len: "12" }) as any
    expect(b.value.options).toMatchObject({ od: 300, odb: 200, b: "grv" })
    expect(b.value.builder.partNumber(b.value.options)).toMatch(/-300-200$/)
  })
  it("refuses an unknown builder, a non-object, and any invalid key", () => {
    expect(parseBuilderOptions("sweep", {})).toEqual({ ok: false, errors: ["Unknown builder_type: sweep"] })
    expect(parseBuilderOptions("hose", [])).toMatchObject({ ok: false })
    expect(parseBuilderOptions("row-manifold", { drops: 49 })).toEqual({ ok: false, errors: ['Invalid value for "drops"'] })
  })
})

describe("StoreCreateCadRequest", () => {
  const body = { builder_type: "transition", options: { od: 200 }, name: "Ada", company: "Acme", email: "Ada@Acme-CDU.com " }
  it("accepts the plan's body (with the bot-protection fields) and lower-cases the email", () => {
    const v = StoreCreateCadRequest.parse({ ...body, website: "", turnstile_token: "t", elapsed_ms: 4000, source_page: "/us/build/transition" })
    expect(v.email).toBe("ada@acme-cdu.com")
  })
  it("is strict and knows only the five builders", () => {
    expect(StoreCreateCadRequest.safeParse({ ...body, fitting_type: "spool" }).success).toBe(false)
    expect(StoreCreateCadRequest.safeParse({ ...body, builder_type: "sweep" }).success).toBe(false)
    expect(StoreCreateCadRequest.safeParse({ ...body, options: { od: { x: 1 } } }).success).toBe(false)
  })
})

function req(headers: Record<string, string>, extra: Record<string, unknown> = {}) {
  return { headers, socket: { remoteAddress: "10.0.0.5" }, ...extra } as any
}

describe("cadClientIp", () => {
  const env = { ...process.env }
  afterEach(() => {
    process.env = { ...env }
  })
  it("trusts x-client-ip only with the storefront secret", () => {
    process.env.STOREFRONT_SHARED_SECRET = "s3cret"
    expect(cadClientIp(req({ "x-storefront-secret": "s3cret", "x-client-ip": "203.0.113.9", "x-real-ip": "10.1.1.1" }))).toEqual({ ip: "203.0.113.9", source: "forwarded" })
    expect(cadClientIp(req({ "x-storefront-secret": "nope", "x-client-ip": "203.0.113.9", "x-real-ip": "10.1.1.1" }))).toEqual({ ip: "10.1.1.1", source: "xff" })
  })
  it("an edge / socket address is recorded but untrusted", () => {
    delete process.env.STOREFRONT_SHARED_SECRET
    expect(cadClientIp(req({ "x-client-ip": "203.0.113.9" }))).toEqual({ ip: "10.0.0.5", source: "socket" })
  })
})

describe("visitor-only bot guards", () => {
  const scope = (review: boolean) => ({
    resolve: (key: string) => (key === "logger" ? { warn: jest.fn() } : { requireReview: async () => review }),
  })
  const res = () => {
    const r: any = {}
    r.status = jest.fn(() => r)
    r.json = jest.fn(() => r)
    return r
  }

  it("a honeypot hit gets a calm 201 shaped like 'review' (or 'emailed' with review off); nothing else runs", async () => {
    for (const review of [true, false]) {
      const next = jest.fn()
      const r = res()
      await cadHoneypot(req({}, { body: { website: "http://spam", email: "Bot@X.com" }, scope: scope(review), path: "/store/cad-requests" }), r, next)
      expect(next).not.toHaveBeenCalled()
      expect(r.status).toHaveBeenCalledWith(201)
      expect(r.json).toHaveBeenCalledWith(honeypotResponse(review, "bot@x.com"))
    }
  })

  it("a too-fast submit trips it too; a real visitor and a signed-in customer pass", async () => {
    const fast = res()
    await cadHoneypot(req({}, { body: { elapsed_ms: 200 }, scope: scope(true), path: "/" }), fast, jest.fn())
    expect(fast.status).toHaveBeenCalledWith(201)
    const next = jest.fn()
    await cadHoneypot(req({}, { body: { website: "", elapsed_ms: 9000 }, scope: scope(true) }), res(), next)
    await cadHoneypot(req({}, { body: { website: "x" }, auth_context: { actor_type: "customer", actor_id: "cus_1" }, scope: scope(true) }), res(), next)
    expect(next).toHaveBeenCalledTimes(2)
  })

  it("Turnstile is skipped for signed-in customers", () => {
    const next = jest.fn()
    cadTurnstile(req({}, { auth_context: { actor_type: "customer", actor_id: "cus_1" } }), res(), next)
    expect(next).toHaveBeenCalled()
  })
})

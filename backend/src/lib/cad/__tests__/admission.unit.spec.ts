import { TRANSITION_BUILDER, type TransitionOptions } from "../../cpq-shared"
import { admitCadRequest, type AdmissionInput } from "../admission"
import { cadCacheKey } from "../cache-key"
import { FakeCadService } from "./fake-cad-service"

// Fixed clock: Friday 2026-10-16 13:00 EDT.
const NOW = new Date("2026-10-16T17:00:00Z")
const DAY = 24 * 60 * 60 * 1000
const CAP_DAY = "2026-10-16"

function cfg(len: number, extra: Partial<TransitionOptions> = {}): TransitionOptions {
  return { ...TRANSITION_BUILDER.defaults, len, ...extra }
}

function setup() {
  const service = new FakeCadService()
  const container = { resolve: () => service as any }
  const admit = (over: Partial<AdmissionInput> & { config?: TransitionOptions } = {}) => {
    const options = over.config ?? cfg(20)
    const { config: _c, ...rest } = over
    return admitCadRequest(container, {
      builderType: "transition",
      options,
      partNumber: over.partNumber ?? TRANSITION_BUILDER.partNumber(options),
      isCustomer: false,
      email: "jane@acme-cdu.com",
      ip: "203.0.113.7",
      ipSource: "forwarded",
      now: NOW,
      ...rest,
    })
  }
  return { service, admit }
}

describe("admitCadRequest: Business Email allowance (10 per rolling 30 days)", () => {
  it("admits the 10th request and blocks the 11th", async () => {
    const { service, admit } = setup()
    for (let i = 0; i < 9; i++) service.addRequest({ email: "jane@acme-cdu.com", created_at: new Date(NOW.getTime() - i * DAY) })
    expect((await admit()).outcome).toBe("generate")
    service.addRequest({ email: "jane@acme-cdu.com", created_at: NOW })
    const r = await admit()
    expect(r).toMatchObject({ outcome: "block", blockReason: "email_allowance" })
    expect(r.counters?.emailRequests30d).toBe(10)
  })

  it("is a rolling window, and uncounted (blocked/rejected) rows do not count", async () => {
    const { service, admit } = setup()
    for (let i = 0; i < 10; i++) service.addRequest({ email: "jane@acme-cdu.com", created_at: new Date(NOW.getTime() - 30 * DAY - 1000 - i) })
    for (let i = 0; i < 12; i++) service.addRequest({ email: "jane@acme-cdu.com", counted: false, status: "blocked" })
    expect((await admit()).outcome).toBe("generate")
  })
})

describe("admitCadRequest: IP limit (5 per rolling 24 h, trusted IP only)", () => {
  it("admits the 5th request from an IP and blocks the 6th", async () => {
    const { service, admit } = setup()
    for (let i = 0; i < 4; i++) service.addRequest({ email: `p${i}@acme.com`, client_ip: "203.0.113.7", ip_source: "forwarded" })
    expect((await admit()).outcome).toBe("generate")
    service.addRequest({ email: "p5@acme.com", client_ip: "203.0.113.7", ip_source: "forwarded" })
    expect(await admit()).toMatchObject({ outcome: "block", blockReason: "ip_daily" })
  })

  it("an untrusted IP source (xff/socket: the shared storefront address) skips the IP limit", async () => {
    const { service, admit } = setup()
    for (let i = 0; i < 20; i++) service.addRequest({ client_ip: "10.0.0.1", ip_source: "xff" })
    expect((await admit({ ip: "10.0.0.1", ipSource: "xff" })).outcome).toBe("generate")
    expect((await admit({ ip: "10.0.0.1", ipSource: "socket", config: cfg(21) })).outcome).toBe("generate")
  })
})

describe("admitCadRequest: site-wide cap (never-generated Part Numbers per Eastern day)", () => {
  it("a cached package is served and does not count", async () => {
    const { service, admit } = setup()
    const pn = TRANSITION_BUILDER.partNumber(cfg(20))
    service.addPackage({ part_number: pn, cache_key: cadCacheKey(pn) })
    service.settings.daily_generation_cap = 0
    expect(await admit()).toMatchObject({ outcome: "serve_cached", countAgainstCap: false })
  })

  it("an ever-generated Part Number (older version) regenerates for free, even at the cap", async () => {
    const { service, admit } = setup()
    const pn = TRANSITION_BUILDER.partNumber(cfg(20))
    service.addPackage({ part_number: pn, cache_key: `${pn}@oldhash-g0-d1` })
    service.settings.daily_generation_cap = 0
    expect(await admit()).toMatchObject({ outcome: "generate", countAgainstCap: false })
    expect(service.packages).toHaveLength(1)
  })

  it("cap 10: ten new Part Numbers generate (and reserve a slot with builder_type); the 11th is queued", async () => {
    const { service, admit } = setup()
    for (let i = 0; i < 10; i++) {
      const r = await admit({ config: cfg(20 + i), email: `u${i}@acme.com`, ip: `203.0.113.${i}` })
      expect(r).toMatchObject({ outcome: "generate", countAgainstCap: true, capDay: CAP_DAY })
      expect(r.reservedPackageId).toBeTruthy()
    }
    expect(service.packages[0]).toMatchObject({ builder_type: "transition", configuration: cfg(20) })
    expect(await service.countCapGenerations(CAP_DAY)).toBe(10)
    const r = await admit({ config: cfg(40), email: "late@acme.com", ip: "203.0.113.99" })
    expect(r).toMatchObject({ outcome: "queue", countAgainstCap: false })
    expect(r.counters).toMatchObject({ generatedToday: 10, cap: 10 })
  })

  it("a second request for a Part Number already claimed today is free", async () => {
    const { service, admit } = setup()
    service.settings.daily_generation_cap = 1
    expect((await admit({ config: cfg(20) })).countAgainstCap).toBe(true)
    expect(await admit({ config: cfg(20), email: "bob@acme.com" })).toMatchObject({ outcome: "generate", countAgainstCap: false })
    expect(await service.countCapGenerations(CAP_DAY)).toBe(1)
  })

  it("the cap resets on the next Eastern day", async () => {
    const { service, admit } = setup()
    service.settings.daily_generation_cap = 1
    await admit({ config: cfg(20) })
    expect((await admit({ config: cfg(21) })).outcome).toBe("queue")
    const tomorrow = new Date("2026-10-17T05:00:00Z") // 01:00 EDT Saturday
    expect(await admit({ config: cfg(21), now: tomorrow })).toMatchObject({ outcome: "generate", countAgainstCap: true, capDay: "2026-10-17" })
  })

  it("concurrent requests cannot both take the last slot", async () => {
    const { service, admit } = setup()
    service.settings.daily_generation_cap = 1
    const [a, b] = await Promise.all([admit({ config: cfg(20), email: "a@acme.com" }), admit({ config: cfg(21), email: "b@acme.com" })])
    expect([a.outcome, b.outcome].sort()).toEqual(["generate", "queue"])
  })

  it("a manifold and a PDF-only kit take the same path", async () => {
    const { service } = setup()
    const container = { resolve: () => service as any }
    const { getBuilder } = require("../../cpq-shared")
    for (const type of ["row-manifold", "cdu-kit"]) {
      const b = getBuilder(type)
      const r = await admitCadRequest(container, {
        builderType: type as any,
        options: b.defaults,
        partNumber: b.partNumber(b.defaults),
        isCustomer: false,
        email: "x@acme.com",
        ip: null,
        ipSource: "socket",
        now: NOW,
      })
      expect(r).toMatchObject({ outcome: "generate", countAgainstCap: true })
      expect(service.packages.find((p) => p.id === r.reservedPackageId)!.builder_type).toBe(type)
    }
  })
})

describe("admitCadRequest: signed-in customers", () => {
  it("bypass the email, IP and cap limits and never count against the cap", async () => {
    const { service, admit } = setup()
    for (let i = 0; i < 20; i++) service.addRequest({ email: "buyer@cdu.com", client_ip: "203.0.113.7", ip_source: "forwarded" })
    service.settings.daily_generation_cap = 0
    expect(await admit({ isCustomer: true, email: "buyer@cdu.com" })).toMatchObject({ outcome: "generate", countAgainstCap: false })
    expect(service.packages).toHaveLength(0)
  })
})

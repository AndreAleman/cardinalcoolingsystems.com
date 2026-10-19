import { describe, expect, it } from "vitest"
import { getBuilder } from "@lib/cpq/shared"
import { cadKindsFor, cadReviewMessage, configFromSharePath, mapCadRequestResponse, validateCadContact } from "../cad"
import { isBusinessEmail } from "@lib/util/business-email"

describe("CAD helpers", () => {
  it("B8: STEP + PDF for transition and manifold, PDF only otherwise", () => {
    expect(cadKindsFor("transition")).toEqual(["step", "pdf"])
    expect(cadKindsFor("row-manifold")).toEqual(["step", "pdf"])
    expect(cadKindsFor("cdu-kit")).toEqual(["pdf"])
    expect(cadKindsFor("strainer")).toEqual(["pdf"])
    expect(cadKindsFor("hose")).toEqual(["pdf"])
  })

  it("the review message names the email", () => {
    expect(cadReviewMessage("a@acme.com")).toBe(
      "Thanks — our engineering team reviews every CAD drawing before release. We'll email your download link to a@acme.com, normally within 1 business day.",
    )
  })

  it("the gate refuses free mail and missing fields", () => {
    expect(validateCadContact({ name: "A", company: "Acme", email: "a@gmail.com" }).ok).toBe(false)
    expect(validateCadContact({ name: "", company: "Acme", email: "a@acme.com" }).ok).toBe(false)
    expect(validateCadContact({ name: "A", company: "Acme", email: " A@Acme.com " })).toEqual({
      ok: true,
      value: { name: "A", company: "Acme", email: "a@acme.com" },
    })
    expect(isBusinessEmail("x@mail.yahoo.co.uk")).toBe(false)
    expect(isBusinessEmail("x@vertiv.com")).toBe(true)
  })

  it("maps review / queued / blocked / errors", () => {
    expect(mapCadRequestResponse(201, { outcome: "review", part_number: "p", cad_request: { display_id: 7 } }, "a@acme.com")).toEqual({
      ok: true, outcome: "review", partNumber: "p", displayId: 7, email: "a@acme.com",
    })
    expect(mapCadRequestResponse(200, { outcome: "blocked" })).toEqual({ ok: true, outcome: "blocked" })
    expect(mapCadRequestResponse(429, { code: "ip_daily" })).toMatchObject({ ok: false, code: "ip_daily" })
    expect(mapCadRequestResponse(503, null)).toMatchObject({ ok: false, code: "unavailable" })
    expect(mapCadRequestResponse(403, { code: "turnstile_failed" })).toMatchObject({ ok: false, code: "turnstile" })
    expect(mapCadRequestResponse(400, { message: "Bad email" })).toMatchObject({ ok: false, code: "invalid", message: "Bad email" })
  })

  it("rebuilds a configuration from a share path", () => {
    const b = getBuilder("transition")
    const c = configFromSharePath(b.sharePath(b.defaults))
    expect(c).toEqual({ type: "transition", options: b.defaults })
    expect(configFromSharePath("/smart-fitting-builder/sweep?v=1")).toBeNull()
    expect(configFromSharePath(null)).toBeNull()
  })
})

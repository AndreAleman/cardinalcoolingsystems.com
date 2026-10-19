// cad_request.created / cad_request.released processing with fakes, review OFF (the Sanitube Phase
// 3 behaviour, still reachable with the admin toggle). Review ON is in cad-review.unit.spec.ts.

jest.mock("../../lib/cad/ensure-package", () => ({ ensurePackageForRequest: jest.fn() }))

import { handleCadRequestCreated, releaseCadRequest, retryCadRequest } from "../cad-request-process"
import { FakeCadService, KIT_OPTIONS, MANIFOLD_OPTIONS, makeDeps, makeRequest } from "./cad-fakes"

function reviewOff(rows: Parameters<typeof makeRequest>[0][] = [{}]) {
  const reqs = rows.map((r) => makeRequest(r))
  const cad = new FakeCadService(reqs)
  cad.requireReview = false
  return { cad, reqs }
}

describe("cad_request.created (review off)", () => {
  it("pending → package, token, link email, emailed, staff 'new' alert to the default inbox", async () => {
    delete process.env.CAD_REQUEST_INBOX_EMAIL
    const { cad, reqs } = reviewOff()
    const req = reqs[0]
    const { deps, sent, ensurePackage } = makeDeps(cad)

    expect(await handleCadRequestCreated(deps, req.id)).toBe("emailed")
    expect(ensurePackage).toHaveBeenCalledTimes(1)
    expect(sent.link).toHaveLength(1)
    expect(sent.link[0].to).toBe(req.email)
    expect(sent.link[0].props).toMatchObject({
      reference: `CAD-${req.display_id}`,
      contactName: "Ada",
      partNumber: req.part_number,
      downloadUrl: "https://cardinalcoolingsystems.com/us/cad/download/tok1",
      quoteUrl: expect.stringContaining("https://cardinalcoolingsystems.com/us/build/transition?v=1&a=tc&b=fl150"),
      validDays: 7,
      hasStep: true,
    })
    expect(sent.link[0].props.configuration).toEqual(expect.arrayContaining([{ label: "End A", value: expect.any(String) }]))
    const row = cad.get(req.id) as any
    expect(row).toMatchObject({ status: "emailed", package_id: `cadpkg_${req.part_number}` })
    expect(row.emailed_at).toBeInstanceOf(Date)

    expect(sent.alert).toHaveLength(1)
    expect(sent.alert[0].to).toEqual(["aleman@cardinalcoolingsystems.com"])
    expect(sent.alert[0].props).toMatchObject({
      kind: "new",
      builderTitle: "Transition Spool",
      emailRequests30d: { used: 7, limit: 10 },
      generationsToday: { used: 10, cap: 10 },
      reviewUrl: expect.stringContaining(`/app/cad-requests/${req.id}`),
    })
  })

  it("a PDF-only kit: the link email says no STEP", async () => {
    const { cad, reqs } = reviewOff([{ builder_type: "cdu-kit", configuration: { ...KIT_OPTIONS }, part_number: "kit-cdu-a5ad698f" }])
    const { deps, sent } = makeDeps(cad)
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("emailed")
    expect(sent.link[0].props.hasStep).toBe(false)
    expect(sent.link[0].props.quoteUrl).toContain("/us/build/cdu-kit?v=1")
  })

  it("generation failure → failed, attempts 1, staff 'failed' alert, nothing to the requester", async () => {
    const { cad, reqs } = reviewOff()
    const { deps, sent } = makeDeps(cad, { failGeneration: "CAD service unavailable" })
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("failed")
    expect(cad.get(reqs[0].id)).toMatchObject({ status: "failed", attempts: 1, error: "CAD service unavailable" })
    expect(sent.link).toHaveLength(0)
    expect(sent.alert.map((a) => a.props.kind)).toEqual(["failed"])
  })

  it("a link email that fails to send marks the request failed (the job retries)", async () => {
    const { cad, reqs } = reviewOff()
    const { deps } = makeDeps(cad)
    ;(deps.email!.sendCadRequestLink as jest.Mock).mockRejectedValueOnce(new Error("Resend down"))
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("failed")
    expect((cad.get(reqs[0].id) as any).error).toMatch(/Resend down/)
  })

  it("queued → requester notice + staff 'queued' alert, no generation; one notice per email per hour", async () => {
    const { cad, reqs } = reviewOff([
      { status: "queued", email: "repeat-queued@acme.com" },
      { status: "queued", email: "repeat-queued@acme.com" },
    ])
    const { deps, sent, ensurePackage } = makeDeps(cad)
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("queued_notified")
    await handleCadRequestCreated(deps, reqs[1].id)
    expect(ensurePackage).not.toHaveBeenCalled()
    expect(sent.queued).toHaveLength(1)
    expect(sent.queued[0].props.review).toBeUndefined()
    expect(sent.alert.map((a) => a.props.kind)).toEqual(["queued", "queued"])
  })

  it("blocked by the email allowance → one 'allowance_reached' alert per email per 24 h; ip_daily → nothing", async () => {
    const { cad, reqs } = reviewOff([
      { status: "blocked", block_reason: "email_allowance", email: "limit@acme.com" },
      { status: "blocked", block_reason: "email_allowance", email: "limit@acme.com" },
      { status: "blocked", block_reason: "ip_daily" },
    ])
    const { deps, sent } = makeDeps(cad)
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("allowance_alerted")
    expect(await handleCadRequestCreated(deps, reqs[1].id)).toBe("skipped")
    expect(await handleCadRequestCreated(deps, reqs[2].id)).toBe("skipped")
    expect(sent.alert.map((x) => x.props.kind)).toEqual(["allowance_reached"])
  })

  it("no notification module: logs the link (with the recipient) and the alert (with the inbox)", async () => {
    delete process.env.CAD_REQUEST_INBOX_EMAIL
    const { cad, reqs } = reviewOff()
    const req = reqs[0]
    const { deps, logs } = makeDeps(cad, { withEmail: false })
    expect(await handleCadRequestCreated(deps, req.id)).toBe("emailed")
    expect(logs).toContainEqual(`info [cad] download link for CAD-${req.display_id} → ${req.email}: https://cardinalcoolingsystems.com/us/cad/download/tok1`)
    expect(logs).toContainEqual(`info [cad] staff new alert for CAD-${req.display_id} → aleman@cardinalcoolingsystems.com (no notification module; not sent)`)
  })

  it("signed-in customer: link to the account email, no staff alert; Resend: no 'new' alert", async () => {
    const { cad, reqs } = reviewOff([{ is_customer: true, customer_id: "cus_1" }, {}])
    const { deps, sent } = makeDeps(cad)
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("emailed")
    expect(await handleCadRequestCreated(deps, reqs[1].id, { resend: true })).toBe("emailed")
    expect(sent.link).toHaveLength(2)
    expect(sent.alert).toHaveLength(0)
  })

  it("already emailed / rejected / review rows are left alone", async () => {
    const { cad, reqs } = reviewOff([{ status: "emailed" }, { status: "rejected" }, { status: "review" }])
    const { deps, sent } = makeDeps(cad)
    for (const r of reqs) expect(await handleCadRequestCreated(deps, r.id)).toBe("skipped")
    expect(sent.link.length + sent.alert.length).toBe(0)
  })

  it("stored options that no longer validate → failed; the alert falls back to raw rows", async () => {
    const { cad, reqs } = reviewOff([{ configuration: { od: 999, a: "tc" } }])
    const { deps, sent, ensurePackage } = makeDeps(cad)
    await handleCadRequestCreated(deps, reqs[0].id)
    expect(ensurePackage).not.toHaveBeenCalled()
    expect(cad.get(reqs[0].id).status).toBe("failed")
    expect(sent.alert[0].props.configuration).toContainEqual({ label: "od", value: "999" })
  })

  it("a manifold request carries the manifold rows and Share Link", async () => {
    const { cad, reqs } = reviewOff([
      { builder_type: "row-manifold", configuration: { ...MANIFOLD_OPTIONS }, part_number: "clmp-clmp-rman-n12-d100clmp-p24-6-400" },
    ])
    const { deps, sent } = makeDeps(cad)
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("emailed")
    expect(sent.link[0].props.quoteUrl).toContain("/us/build/row-manifold?v=1&header=400")
    expect(sent.link[0].props.configuration).toContainEqual({ label: "Header OD", value: '4"' })
  })
})

describe("cad_request.released (review off)", () => {
  it("queued → released_at/by set, emailed, no 'new' alert", async () => {
    const { cad, reqs } = reviewOff([{ status: "queued", queued_at: new Date("2026-10-16T15:00:00Z") }])
    const now = new Date("2026-10-19T13:00:00Z")
    const { deps, sent } = makeDeps(cad, { now })
    expect(await releaseCadRequest(deps, reqs[0].id, "auto")).toBe("emailed")
    expect(cad.get(reqs[0].id)).toMatchObject({ status: "emailed", released_by: "auto", released_at: now })
    expect(sent.link).toHaveLength(1)
    expect(sent.alert).toHaveLength(0)
  })

  it("rejected rows are not released; retry stops at 3 attempts", async () => {
    const { cad, reqs } = reviewOff([{ status: "rejected" }, { status: "failed", attempts: 3 }])
    const { deps, ensurePackage } = makeDeps(cad)
    expect(await releaseCadRequest(deps, reqs[0].id)).toBe("skipped")
    expect(await retryCadRequest(deps, reqs[1].id)).toBe("skipped")
    expect(ensurePackage).not.toHaveBeenCalled()
  })
})

describe("rejected / marked spam mid-processing", () => {
  const markSpam = async (cad: FakeCadService, id: string) =>
    cad.updateCadRequests({ id, status: "rejected", reject_reason: "spam", token_hash: null, token_expires_at: null })

  it("during generation: no token, no link, no alert; stays rejected", async () => {
    const { cad, reqs } = reviewOff()
    const { deps, sent, ensurePackage } = makeDeps(cad)
    ensurePackage.mockImplementationOnce(async (r: any) => {
      await markSpam(cad, r.id)
      return { id: "cadpkg_x" }
    })
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("skipped")
    expect(cad.tokens).toBe(0)
    expect(sent.link.length + sent.alert.length + sent.queued.length).toBe(0)
    expect(cad.get(reqs[0].id).status).toBe("rejected")
  })

  it("generation fails after being rejected: stays rejected (not failed), no failed alert", async () => {
    const { cad, reqs } = reviewOff()
    const { deps, sent, ensurePackage } = makeDeps(cad)
    ensurePackage.mockImplementationOnce(async (r: any) => {
      await markSpam(cad, r.id)
      throw new Error("CAD service 500")
    })
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("skipped")
    expect(cad.get(reqs[0].id)).toMatchObject({ status: "rejected", attempts: 0 })
    expect(sent.alert).toHaveLength(0)
  })

  it("rejected while the token is issued: the new token is cleared and nothing is sent", async () => {
    const { cad, reqs } = reviewOff()
    const { deps, sent } = makeDeps(cad)
    cad.issueToken = async (id: string) => {
      await markSpam(cad, id)
      await cad.updateCadRequests({ id, token_hash: "h1", token_expires_at: new Date() })
      return { token: "tok-late", expires_at: new Date() }
    }
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("skipped")
    expect(cad.get(reqs[0].id) as any).toMatchObject({ status: "rejected", token_hash: null, token_expires_at: null })
    expect(sent.link).toHaveLength(0)
  })
})

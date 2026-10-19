// CAD Review (plan B7; Sanitube docs/cpq-cad-review-plan.md R1–R11): the subscriber, approve and
// the hourly job with `require_review` on (the default), with fakes.

jest.mock("../ensure-package", () => ({ ensurePackageForRequest: jest.fn() }))

import { nextReleaseAt } from "../business-day"
import { processCadQueue, type CadQueueDeps } from "../../../jobs/process-cad-queue"
import { approveCadRequest, handleCadRequestCreated, releaseCadRequest, retryCadRequest, reviewRequired } from "../../../subscribers/cad-request-process"
import { FakeCadService, makeDeps, makeRequest } from "./cad-fakes"

function reviewOn(rows: Parameters<typeof makeRequest>[0][] = [{}]) {
  const reqs = rows.map((r) => makeRequest(r))
  const cad = new FakeCadService(reqs)
  cad.requireReview = true
  return { cad, reqs }
}

describe("reviewRequired", () => {
  it("is on unless the setting is explicitly false; a read error counts as on", async () => {
    const cad = new FakeCadService()
    const { deps } = makeDeps(cad)
    cad.requireReview = true
    expect(await reviewRequired(deps)).toBe(true)
    cad.requireReview = undefined
    expect(await reviewRequired(deps)).toBe(true)
    cad.requireReview = false
    expect(await reviewRequired(deps)).toBe(false)
    cad.getSettings = async () => {
      throw new Error("db down")
    }
    expect(await reviewRequired(deps)).toBe(true)
  })
})

describe("cad_request.created with review on", () => {
  it("visitor: generates, moves to review, no token / link; requester notice (review copy) + one 'review' alert", async () => {
    delete process.env.CAD_REQUEST_INBOX_EMAIL
    const { cad, reqs } = reviewOn()
    const req = reqs[0]
    const { deps, sent, ensurePackage } = makeDeps(cad)

    expect(await handleCadRequestCreated(deps, req.id)).toBe("review")
    expect(ensurePackage).toHaveBeenCalledTimes(1)
    expect(cad.tokens).toBe(0)
    expect(sent.link).toHaveLength(0)
    expect(cad.get(req.id)).toMatchObject({ status: "review", package_id: `cadpkg_${req.part_number}` })
    expect(sent.queued).toHaveLength(1)
    expect(sent.queued[0]).toMatchObject({ to: req.email, props: { review: true, partNumber: req.part_number } })
    expect(sent.alert.map((a) => a.props.kind)).toEqual(["review"])
    expect(sent.alert[0].to).toEqual(["aleman@cardinalcoolingsystems.com"])
    expect(sent.alert[0].props.reviewUrl).toContain(`/app/cad-requests/${req.id}`)
  })

  it("the staff inbox comes from CAD_REQUEST_INBOX_EMAIL when set", async () => {
    process.env.CAD_REQUEST_INBOX_EMAIL = "a@cardinalcoolingsystems.com, b@cardinalcoolingsystems.com"
    try {
      const { cad, reqs } = reviewOn()
      const { deps, sent } = makeDeps(cad)
      await handleCadRequestCreated(deps, reqs[0].id)
      expect(sent.alert[0].to).toEqual(["a@cardinalcoolingsystems.com", "b@cardinalcoolingsystems.com"])
    } finally {
      delete process.env.CAD_REQUEST_INBOX_EMAIL
    }
  })

  it("the 'review' alert is sent once per request", async () => {
    const { cad, reqs } = reviewOn()
    const { deps, sent } = makeDeps(cad)
    await handleCadRequestCreated(deps, reqs[0].id)
    await cad.updateCadRequests({ id: reqs[0].id, status: "pending" })
    await handleCadRequestCreated(deps, reqs[0].id)
    expect(sent.alert.filter((a) => a.props.kind === "review")).toHaveLength(1)
  })

  it("signed-in customer: also reviewed; notice to the account email, 'review' alert, no link", async () => {
    const { cad, reqs } = reviewOn([{ is_customer: true, customer_id: "cus_1", client_ip: null }])
    const { deps, sent } = makeDeps(cad)
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("review")
    expect(sent.link).toHaveLength(0)
    expect(sent.queued.map((q) => q.to)).toEqual([reqs[0].email])
    expect(sent.alert[0].props).toMatchObject({ kind: "review", isCustomer: true })
  })

  it("no notification module: logs the review state and the alert recipient, never a download link", async () => {
    delete process.env.CAD_REQUEST_INBOX_EMAIL
    const { cad, reqs } = reviewOn()
    const { deps, logs } = makeDeps(cad, { withEmail: false })
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("review")
    expect(logs.some((l) => l.includes("awaiting review"))).toBe(true)
    expect(logs).toContainEqual(
      `info [cad] staff review alert for CAD-${reqs[0].display_id} → aleman@cardinalcoolingsystems.com (no notification module; not sent)`,
    )
    expect(logs.some((l) => l.includes("download link"))).toBe(false)
  })

  it("queued: notice and 'queued' alert both carry the review copy; no generation", async () => {
    const { cad, reqs } = reviewOn([{ status: "queued", queued_at: new Date("2026-10-16T15:00:00Z") }])
    const { deps, sent, ensurePackage } = makeDeps(cad)
    expect(await handleCadRequestCreated(deps, reqs[0].id)).toBe("queued_notified")
    expect(ensurePackage).not.toHaveBeenCalled()
    expect(sent.queued[0].props.review).toBe(true)
    expect(sent.alert.map((a) => [a.props.kind, a.props.review])).toEqual([["queued", true]])
  })

  it("Resend link skips review (already delivered)", async () => {
    const { cad, reqs } = reviewOn()
    const { deps, sent } = makeDeps(cad)
    expect(await handleCadRequestCreated(deps, reqs[0].id, { resend: true })).toBe("emailed")
    expect(sent.link).toHaveLength(1)
  })
})

describe("Approve & send", () => {
  it("review → approved_at/by, token, link email, emailed; no 'new' alert", async () => {
    const { cad, reqs } = reviewOn()
    const { deps, sent } = makeDeps(cad)
    await handleCadRequestCreated(deps, reqs[0].id)
    sent.alert.length = 0
    expect(await approveCadRequest(deps, reqs[0].id, "user_1")).toBe("emailed")
    const row = cad.get(reqs[0].id) as any
    expect(row).toMatchObject({ status: "emailed", approved_by: "user_1" })
    expect(row.approved_at).toBeInstanceOf(Date)
    expect(sent.link).toHaveLength(1)
    expect(sent.link[0].props.downloadUrl).toMatch(/\/us\/cad\/download\/tok1$/)
    expect(sent.alert).toHaveLength(0)
  })

  it("only from review", async () => {
    const { cad, reqs } = reviewOn([{ status: "queued" }, { status: "emailed" }, { status: "rejected" }])
    const { deps, sent } = makeDeps(cad)
    for (const r of reqs) expect(await approveCadRequest(deps, r.id, "user_1")).toBe("skipped")
    expect(sent.link).toHaveLength(0)
  })

  it("a failed send keeps approved_at; the job retry sends without another review (R11)", async () => {
    const { cad, reqs } = reviewOn()
    const { deps, sent } = makeDeps(cad)
    await handleCadRequestCreated(deps, reqs[0].id)
    ;(deps.email!.sendCadRequestLink as jest.Mock).mockRejectedValueOnce(new Error("Resend down"))
    expect(await approveCadRequest(deps, reqs[0].id, "user_1")).toBe("failed")
    expect(cad.get(reqs[0].id)).toMatchObject({ status: "failed", approved_by: "user_1" })
    expect(await retryCadRequest(deps, reqs[0].id)).toBe("emailed")
    expect(sent.link).toHaveLength(1)
    expect(sent.link[0].props.downloadUrl).toMatch(/tok2$/)
  })

  it("a request left in review after review was turned off can still be approved", async () => {
    const { cad, reqs } = reviewOn([{ status: "review", package_id: "cadpkg_1" }])
    cad.requireReview = false
    const { deps, sent } = makeDeps(cad)
    expect(await approveCadRequest(deps, reqs[0].id, "user_1")).toBe("emailed")
    expect(sent.link).toHaveLength(1)
  })
})

describe("release / retry with review on", () => {
  it("Generate now on a queued request → review, no link; no second requester notice", async () => {
    const { cad, reqs } = reviewOn([{ status: "queued", queued_at: new Date("2026-10-16T15:00:00Z") }])
    const { deps, sent } = makeDeps(cad)
    expect(await releaseCadRequest(deps, reqs[0].id, "user_1")).toBe("review")
    expect(cad.get(reqs[0].id)).toMatchObject({ status: "review", released_by: "user_1" })
    expect(sent.link).toHaveLength(0)
    expect(sent.queued).toHaveLength(0)
    expect(sent.alert.map((a) => a.props.kind)).toEqual(["review"])
  })

  it("retry of a never-approved failed request lands in review", async () => {
    const { cad, reqs } = reviewOn([{ status: "failed", attempts: 1 }])
    const { deps, sent } = makeDeps(cad)
    expect(await retryCadRequest(deps, reqs[0].id)).toBe("review")
    expect(sent.link).toHaveLength(0)
  })
})

describe("hourly job with review on (R5)", () => {
  const utc = (s: string) => new Date(s)
  const jobDeps = (cad: FakeCadService, now: Date) => {
    const made = makeDeps(cad, { now })
    const deps: CadQueueDeps = { ...made.deps, nextReleaseAt }
    return { ...made, deps }
  }

  it("generates due queued requests and moves them to review; never emails a link", async () => {
    const { cad, reqs } = reviewOn([
      { status: "queued", queued_at: utc("2026-10-16T21:00:00Z") }, // Fri 17:00 EDT
      { status: "failed", attempts: 1 },
      { status: "pending", created_at: utc("2026-10-19T12:00:00Z") },
    ])
    const now = utc("2026-10-19T13:00:00Z") // Mon 09:00 EDT
    const { deps, sent } = jobDeps(cad, now)
    const res = await processCadQueue(deps, now)
    expect(res.released).toEqual([{ id: reqs[0].id, outcome: "review" }])
    expect(res.retried).toEqual([{ id: reqs[1].id, outcome: "review" }])
    expect(res.recovered).toEqual([{ id: reqs[2].id, outcome: "review" }])
    expect(reqs.map((r) => cad.get(r.id).status)).toEqual(["review", "review", "review"])
    expect(sent.link).toHaveLength(0)
  })

  it("leaves rows in review alone", async () => {
    const { cad, reqs } = reviewOn([{ status: "review" }])
    const now = utc("2026-10-19T13:00:00Z")
    const { deps, ensurePackage } = jobDeps(cad, now)
    await processCadQueue(deps, now)
    expect(cad.get(reqs[0].id).status).toBe("review")
    expect(ensurePackage).not.toHaveBeenCalled()
  })
})

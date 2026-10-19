// Hourly CAD queue job. Uses the real business-day calendar (America/New_York, Mon–Fri 09:00; US
// holidays are not skipped) and fakes for everything else. Review OFF here (the release path that
// emails); review ON is covered in subscribers/__tests__/cad-review.unit.spec.ts.

jest.mock("../../lib/cad/ensure-package", () => ({ ensurePackageForRequest: jest.fn() }))

import { nextReleaseAt } from "../../lib/cad/business-day"
import { isQueuedRequestDue, processCadQueue, config, type CadQueueDeps } from "../process-cad-queue"
import { FakeCadService, MANIFOLD_OPTIONS, makeDeps, makeRequest } from "../../subscribers/__tests__/cad-fakes"

const utc = (s: string) => new Date(s)

describe("release time: 09:00 Eastern, next business day", () => {
  const due = (queuedAt: string, now: string) => isQueuedRequestDue({ nextReleaseAt }, utc(queuedAt), utc(now))

  it.each([
    ["2026-10-16T21:00:00Z", "2026-10-19T13:00:00.000Z", "Friday 17:00 EDT → Monday 09:00 EDT"],
    ["2026-10-17T15:00:00Z", "2026-10-19T13:00:00.000Z", "Saturday → Monday"],
    ["2026-10-19T03:00:00Z", "2026-10-19T13:00:00.000Z", "Sunday 23:00 EDT (Monday in UTC) → Monday"],
    ["2026-10-13T12:00:00Z", "2026-10-14T13:00:00.000Z", "Tuesday 08:00 EDT → Wednesday 09:00"],
    ["2026-10-30T17:00:00Z", "2026-11-02T14:00:00.000Z", "DST ends Nov 1: Monday 09:00 EST = 14:00Z"],
    ["2027-03-12T17:00:00Z", "2027-03-15T13:00:00.000Z", "DST starts Mar 14: Monday 09:00 EDT = 13:00Z"],
  ])("%s → %s (%s)", (queuedAt, release) => {
    expect(nextReleaseAt(utc(queuedAt)).toISOString()).toBe(release)
    const r = utc(release).getTime()
    expect(due(queuedAt, new Date(r - 60_000).toISOString())).toBe(false)
    expect(due(queuedAt, new Date(r).toISOString())).toBe(true)
  })

  it("a weekend is never a release day; the job runs hourly", () => {
    expect(due("2026-10-16T21:00:00Z", "2026-10-18T23:00:00Z")).toBe(false)
    expect(config).toEqual({ name: "process-cad-queue", schedule: "0 * * * *" })
  })
})

function jobDeps(cad: FakeCadService, opts: Parameters<typeof makeDeps>[1] = {}) {
  cad.requireReview = false
  const made = makeDeps(cad, opts)
  const deps: CadQueueDeps = { ...made.deps, nextReleaseAt }
  return { ...made, deps }
}

describe("processCadQueue (review off)", () => {
  it("releases due queued requests only; released ones are emailed without a 'new' alert", async () => {
    const dueRow = makeRequest({ status: "queued", queued_at: utc("2026-10-16T21:00:00Z") })
    const notDue = makeRequest({ status: "queued", queued_at: utc("2026-10-19T12:50:00Z") })
    const cad = new FakeCadService([dueRow, notDue])
    const now = utc("2026-10-19T13:00:00Z")
    const { deps, sent } = jobDeps(cad, { now })
    const res = await processCadQueue(deps, now)
    expect(res.released).toEqual([{ id: dueRow.id, outcome: "emailed" }])
    expect(cad.get(dueRow.id)).toMatchObject({ status: "emailed", released_by: "auto" })
    expect(cad.get(notDue.id).status).toBe("queued")
    expect(sent.link.map((l) => l.to)).toEqual([dueRow.email])
    expect(sent.alert).toHaveLength(0)
  })

  it("retries failed requests until 3 attempts, one 'failed' alert per request per 24 h", async () => {
    const row = makeRequest({ status: "failed", attempts: 1 })
    const exhausted = makeRequest({ status: "failed", attempts: 3 })
    const cad = new FakeCadService([row, exhausted])
    const now = utc("2026-10-16T18:00:00Z")
    const { deps, ensurePackage, sent } = jobDeps(cad, { now, failGeneration: true })
    expect((await processCadQueue(deps, now)).retried).toEqual([{ id: row.id, outcome: "failed" }])
    expect((await processCadQueue(deps, now)).retried).toEqual([{ id: row.id, outcome: "failed" }])
    expect((await processCadQueue(deps, now)).retried).toEqual([])
    expect(ensurePackage).toHaveBeenCalledTimes(2)
    expect(cad.get(row.id).attempts).toBe(3)
    expect(sent.alert.filter((a) => a.props.kind === "failed")).toHaveLength(1)
  })

  it("retries at most 10 failed requests per run, oldest first", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => makeRequest({ status: "failed", attempts: 1, created_at: new Date(Date.UTC(2026, 9, 16, 12, i)) }))
    const cad = new FakeCadService(rows)
    const now = utc("2026-10-16T18:00:00Z")
    const { deps } = jobDeps(cad, { now })
    expect((await processCadQueue(deps, now)).retried.map((r) => r.id)).toEqual(rows.slice(0, 10).map((r) => r.id))
  })

  it("recovers pending requests older than 10 minutes (lost event), leaves fresh ones", async () => {
    const now = utc("2026-10-16T18:00:00Z")
    const stale = makeRequest({ status: "pending", created_at: utc("2026-10-16T17:49:00Z") })
    const fresh = makeRequest({ status: "pending", created_at: utc("2026-10-16T17:55:00Z") })
    const cad = new FakeCadService([stale, fresh])
    const { deps } = jobDeps(cad, { now })
    expect((await processCadQueue(deps, now)).recovered).toEqual([{ id: stale.id, outcome: "emailed" }])
    expect(cad.get(fresh.id).status).toBe("pending")
  })

  it("releases a queued manifold with its own Share Link", async () => {
    const row = makeRequest({
      status: "queued",
      queued_at: utc("2026-10-16T21:00:00Z"),
      builder_type: "row-manifold",
      configuration: { ...MANIFOLD_OPTIONS },
      part_number: "clmp-clmp-rman-n12-d100clmp-p24-6-400",
    })
    const cad = new FakeCadService([row])
    const now = utc("2026-10-19T13:00:00Z")
    const { deps, sent, ensurePackage } = jobDeps(cad, { now })
    expect((await processCadQueue(deps, now)).released).toEqual([{ id: row.id, outcome: "emailed" }])
    expect(ensurePackage.mock.calls[0][0].builder_type).toBe("row-manifold")
    expect(sent.link[0].props.quoteUrl).toContain("/us/build/row-manifold?")
  })
})

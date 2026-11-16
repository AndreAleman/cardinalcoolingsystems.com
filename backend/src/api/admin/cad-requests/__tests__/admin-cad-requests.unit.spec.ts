import { getBuilder } from "../../../../lib/cpq-shared"
import { AdminUpdateCadSettings } from "../../cad-settings/validators"
import {
  actionConflict,
  buildListFilters,
  easternDay,
  rejectPatch,
  releasePatch,
  resendPatch,
  spamConflict,
  spamPatch,
  tokenState,
  toAdminCadRequest,
} from "../helpers"
import type { CadRequestRow } from "../module"
import { AdminListCadRequestsParams, AdminRejectCadRequest, AdminSpamCadRequest, AdminUpdateCadRequest } from "../validators"

const T = { ...getBuilder("transition").defaults }

function row(over: Partial<CadRequestRow> = {}): CadRequestRow {
  return {
    id: "cadr_1",
    display_id: 12,
    status: "queued",
    builder_type: "transition",
    configuration: T,
    config_key: "k",
    part_number: "clmp-fl150-tspool-l12-6-200",
    description: "d",
    is_customer: false,
    customer_id: null,
    contact_name: "Ada",
    company_name: "Acme CDU",
    email: "ada@acme-cdu.com",
    client_ip: "1.2.3.4",
    ip_source: "forwarded",
    source_page: null,
    counted: true,
    block_reason: null,
    package_id: null,
    token_hash: "abc",
    token_expires_at: null,
    download_count: 0,
    last_downloaded_at: null,
    emailed_at: null,
    queued_at: null,
    released_at: null,
    released_by: null,
    attempts: 0,
    error: null,
    staff_notes: null,
    created_at: "2026-10-16T12:00:00Z",
    updated_at: "2026-10-16T12:00:00Z",
    ...over,
  }
}

describe("AdminUpdateCadSettings", () => {
  it("accepts whole numbers 0..1000, require_review alone or with the cap", () => {
    for (const n of [0, 1, 10, 1000]) expect(AdminUpdateCadSettings.parse({ daily_generation_cap: n }).daily_generation_cap).toBe(n)
    expect(AdminUpdateCadSettings.parse({ require_review: false })).toEqual({ require_review: false })
    expect(AdminUpdateCadSettings.parse({ require_review: true, daily_generation_cap: 3 })).toEqual({ require_review: true, daily_generation_cap: 3 })
  })
  it("rejects non-integers, out of range, strings, empty, extra keys, non-boolean review", () => {
    for (const body of [
      { daily_generation_cap: 1.5 },
      { daily_generation_cap: -1 },
      { daily_generation_cap: 1001 },
      { daily_generation_cap: "10" },
      {},
      { daily_generation_cap: 5, updated_by: "x" },
      { require_review: "false" },
      { require_review: null },
    ]) {
      expect(AdminUpdateCadSettings.safeParse(body).success).toBe(false)
    }
  })
})

describe("AdminListCadRequestsParams", () => {
  it("defaults limit/offset and accepts comma-separated or repeated statuses, builder_type, exclude_spam", () => {
    const a = AdminListCadRequestsParams.parse({ status: "emailed,ready", exclude_spam: "true", builder_type: "row-manifold" })
    expect(a).toMatchObject({ status: ["emailed", "ready"], limit: 25, offset: 0, exclude_spam: true, builder_type: "row-manifold" })
    expect(AdminListCadRequestsParams.parse({ status: ["queued", "review"] }).status).toEqual(["queued", "review"])
    expect(AdminListCadRequestsParams.parse({ status: "" }).status).toBeUndefined()
  })
  it("rejects unknown statuses and builder types", () => {
    expect(AdminListCadRequestsParams.safeParse({ status: "queued,shipped" }).success).toBe(false)
    expect(AdminListCadRequestsParams.safeParse({ builder_type: "sweep" }).success).toBe(false)
  })
})

describe("body validators", () => {
  it("update needs staff_notes (string or null) and is strict", () => {
    expect(AdminUpdateCadRequest.safeParse({ staff_notes: "x" }).success).toBe(true)
    expect(AdminUpdateCadRequest.safeParse({ staff_notes: null }).success).toBe(true)
    expect(AdminUpdateCadRequest.safeParse({}).success).toBe(false)
    expect(AdminUpdateCadRequest.safeParse({ staff_notes: "x", status: "emailed" }).success).toBe(false)
    expect(AdminUpdateCadRequest.safeParse({ staff_notes: "x".repeat(4001) }).success).toBe(false)
  })
  it("reject / spam take optional notes and are strict", () => {
    expect(AdminRejectCadRequest.safeParse({}).success).toBe(true)
    expect(AdminSpamCadRequest.safeParse({ staff_notes: "bot" }).success).toBe(true)
    expect(AdminRejectCadRequest.safeParse({ reason: "spam" }).success).toBe(false)
  })
})

describe("actionConflict (409 rules)", () => {
  it("approve: only review (R3); reject: queued or review (R4)", () => {
    expect(actionConflict("approve", "review")).toBeNull()
    for (const s of ["pending", "queued", "emailed", "ready", "failed", "rejected", "blocked"] as const) {
      expect(actionConflict("approve", s)).toMatch(/cannot be approved/)
    }
    expect(actionConflict("reject", "queued")).toBeNull()
    expect(actionConflict("reject", "review")).toBeNull()
    expect(actionConflict("reject", "emailed")).not.toBeNull()
  })
  it("release: queued or failed, never review; resend: emailed or ready", () => {
    expect(actionConflict("release", "queued")).toBeNull()
    expect(actionConflict("release", "failed")).toBeNull()
    expect(actionConflict("release", "review")).toMatch(/cannot be released/)
    expect(actionConflict("resend", "emailed")).toBeNull()
    expect(actionConflict("resend", "ready")).toBeNull()
    expect(actionConflict("resend", "queued")).not.toBeNull()
  })
})

describe("patches", () => {
  const now = new Date("2026-10-16T15:00:00Z")
  it("release of a queued request records who and when; retry of a failed one does not", () => {
    expect(releasePatch(row({ status: "queued" }), "user_1", now)).toEqual({ id: "cadr_1", status: "pending", error: null, released_at: now, released_by: "user_1" })
    expect(releasePatch(row({ status: "failed", error: "boom" }), "user_1", now)).toEqual({ id: "cadr_1", status: "pending", error: null })
  })
  it("reject stops counting, clears any token, and only sets notes when given", () => {
    expect(rejectPatch(row(), undefined)).toEqual({ id: "cadr_1", status: "rejected", reject_reason: "other", counted: false, token_hash: null, token_expires_at: null })
    expect(rejectPatch(row(), "competitor")).toMatchObject({ staff_notes: "competitor" })
  })
  it("resend invalidates the old token and resets the budget", () => {
    expect(resendPatch(row({ status: "emailed", download_count: 7 }))).toEqual({
      id: "cadr_1",
      status: "pending",
      token_hash: null,
      token_expires_at: null,
      download_count: 0,
      last_downloaded_at: null,
      error: null,
    })
  })
  it("spam: rejected/spam, token cleared, counted untouched, audit line; skips customers and repeats", () => {
    const r = spamPatch(row({ staff_notes: "note" }), { now, actor: "user_1" }) as any
    expect(r.patch).toMatchObject({ status: "rejected", reject_reason: "spam", token_hash: null, token_expires_at: null })
    expect("counted" in r.patch).toBe(false)
    expect(r.patch.staff_notes).toBe("note\n[2026-10-16] Marked spam by user_1")
    expect(spamPatch(row({ is_customer: true }), { now, actor: null })).toEqual({ skip: "customer" })
    expect(spamPatch(row({ status: "rejected", reject_reason: "spam" }), { now, actor: null })).toEqual({ skip: "already" })
    expect(spamConflict("customer")).toMatch(/signed-in customer/)
  })
})

describe("buildListFilters / easternDay", () => {
  it("maps status, builder, email, spam and q", () => {
    expect(buildListFilters({})).toEqual({})
    expect(buildListFilters({ status: ["review"] })).toEqual({ status: "review" })
    expect(buildListFilters({ status: ["emailed", "ready"], builder_type: "hose" })).toEqual({ status: ["emailed", "ready"], builder_type: "hose" })
    expect(buildListFilters({ email: " Ada@Acme.com " })).toEqual({ email: "ada@acme.com" })
    expect((buildListFilters({ exclude_spam: true }) as any).$and).toHaveLength(1)
    const f = buildListFilters({ q: " tspool " }) as any
    expect(f.$or).toContainEqual({ part_number: { $ilike: "%tspool%" } })
    expect(buildListFilters({ q: "   " })).toEqual({})
  })
  it("easternDay uses America/New_York, not UTC", () => {
    expect(easternDay(new Date("2026-10-17T03:00:00Z"))).toBe("2026-10-16")
    expect(easternDay(new Date("2026-10-17T04:30:00Z"))).toBe("2026-10-17")
    expect(easternDay(new Date("2026-01-02T04:59:00Z"))).toBe("2026-01-01")
  })
})

describe("tokenState / toAdminCadRequest", () => {
  const now = new Date("2026-10-16T12:00:00Z")
  it("reports active, expired and exhausted links", () => {
    expect(tokenState({ token_hash: null, token_expires_at: null, download_count: 0 }, now)).toMatchObject({ issued: false, active: false })
    expect(tokenState({ token_hash: "h", token_expires_at: "2026-10-20T00:00:00Z", download_count: 3 }, now)).toEqual({
      issued: true,
      expires_at: "2026-10-20T00:00:00.000Z",
      expired: false,
      downloads_used: 3,
      downloads_remaining: 17,
      active: true,
    })
    expect(tokenState({ token_hash: "h", token_expires_at: "2026-10-10T00:00:00Z", download_count: 0 }, now)).toMatchObject({ expired: true, active: false })
    expect(tokenState({ token_hash: "h", token_expires_at: "2026-10-20T00:00:00Z", download_count: 20 }, now)).toMatchObject({ downloads_remaining: 0, active: false })
  })
  it("never exposes token_hash; adds builder title, has_step, rows and the Share Link", () => {
    const v = toAdminCadRequest(row(), now) as any
    expect("token_hash" in v).toBe(false)
    expect(v).toMatchObject({ builder_title: "Transition Spool", has_step: true })
    expect(v.configuration_display.map((d: any) => d.label)).toContain("End A")
    expect(v.share_path).toMatch(/^\/build\/transition\?v=1/)
  })
  it("a kit is PDF only; unparseable options fall back to raw rows", () => {
    const kit = toAdminCadRequest(row({ builder_type: "cdu-kit", configuration: { ...getBuilder("cdu-kit").defaults } }), now)
    expect(kit).toMatchObject({ builder_title: getBuilder("cdu-kit").title, has_step: false })
    const bad = toAdminCadRequest(row({ configuration: { od: 999 } }), now)
    expect(bad.configuration_display).toEqual([{ label: "od", value: "999" }])
    expect(bad.share_path).toBeNull()
  })
})

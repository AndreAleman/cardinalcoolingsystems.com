// Pure helpers for the admin CAD Request routes (ported from Sanitube). No container access here,
// so everything is unit-testable.

import { builderHasStep, builderTitle, storedBuilderOptions } from "../../../lib/cad/builder-options"
import { capDayFor } from "../../../lib/cad/business-day"
import { CAD_DOWNLOAD_LIMIT } from "../../../modules/cad-request/types"
import type { CadRejectReason, CadRequestRow, CadRequestStatus } from "./module"

export const DOWNLOAD_LIMIT = CAD_DOWNLOAD_LIMIT

// List tabs → statuses. "Delivered" = the link went out (visitor) or the customer downloaded
// directly (review off).
export const CAD_REQUEST_TABS = {
  all: null,
  review: ["review"], // CAD Review: "Awaiting review"
  queued: ["queued"],
  delivered: ["emailed", "ready"],
  blocked: ["blocked"],
  failed: ["failed"],
} as const satisfies Record<string, readonly CadRequestStatus[] | null>
export type CadRequestTab = keyof typeof CAD_REQUEST_TABS

// Which statuses each staff action accepts. Anything else → 409.
export const ACTION_ALLOWED_FROM = {
  release: ["queued", "failed"],
  reject: ["queued", "review"], // CAD Review R4
  resend: ["emailed", "ready"],
  approve: ["review"], // CAD Review R3
} as const satisfies Record<string, readonly CadRequestStatus[]>
export type CadRequestAction = keyof typeof ACTION_ALLOWED_FROM

export function actionConflict(action: CadRequestAction, status: CadRequestStatus): string | null {
  const allowed = ACTION_ALLOWED_FROM[action] as readonly CadRequestStatus[]
  if (allowed.includes(status)) return null
  const verb = { release: "released", reject: "rejected", resend: "resent", approve: "approved" }[action]
  return `A CAD Request that is "${status}" cannot be ${verb} (allowed: ${allowed.join(", ")}).`
}

/** "2026-10-18" in America/New_York: the same day key as CadPackage.cap_day. */
export function easternDay(now: Date): string {
  return capDayFor(now)
}

export function buildListFilters(v: {
  status?: CadRequestStatus[]
  builder_type?: string
  q?: string
  email?: string
  reject_reason?: CadRejectReason
  exclude_spam?: boolean
}): Record<string, unknown> {
  const filters: Record<string, unknown> = {}
  if (v.status?.length) filters.status = v.status.length === 1 ? v.status[0] : v.status
  if (v.builder_type) filters.builder_type = v.builder_type
  // ?reject_reason=spam is the Spam tab; ?exclude_spam=true (the All tab) keeps NULL reasons,
  // which a bare `!= 'spam'` would drop.
  if (v.reject_reason) filters.reject_reason = v.reject_reason
  if (v.exclude_spam) filters.$and = [{ $or: [{ reject_reason: null }, { reject_reason: { $ne: "spam" } }] }]
  if (v.email) filters.email = v.email.trim().toLowerCase()
  const q = v.q?.trim()
  if (q) {
    const like = { $ilike: `%${q}%` }
    filters.$or = [{ email: like }, { company_name: like }, { contact_name: like }, { part_number: like }]
  }
  return filters
}

export type TokenState = {
  issued: boolean
  expires_at: string | null
  expired: boolean
  downloads_used: number
  downloads_remaining: number
  active: boolean
}

export function tokenState(row: Pick<CadRequestRow, "token_hash" | "token_expires_at" | "download_count">, now: Date): TokenState {
  const issued = !!row.token_hash
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at) : null
  const expired = !!expiresAt && expiresAt.getTime() <= now.getTime()
  const used = Math.max(0, Number(row.download_count) || 0)
  const remaining = Math.max(0, DOWNLOAD_LIMIT - used)
  return {
    issued,
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    expired,
    downloads_used: used,
    downloads_remaining: remaining,
    active: issued && !expired && remaining > 0,
  }
}

/** Server-built Configuration rows + Share Link, parsed with the row's builder. */
export function configurationView(
  configuration: Record<string, unknown> | null | undefined,
  builderType: string | null | undefined,
): { configuration_display: { label: string; value: string }[]; share_path: string | null } {
  const parsed = storedBuilderOptions(builderType, configuration)
  if (parsed) {
    return {
      configuration_display: parsed.builder.display(parsed.options),
      share_path: parsed.builder.sharePath(parsed.options),
    }
  }
  // Stored rows are canonical, so this is only a fallback for bad data.
  return {
    configuration_display: Object.entries(configuration ?? {})
      .filter(([, v]) => v != null && typeof v !== "object")
      .map(([label, value]) => ({ label, value: String(value) })),
    share_path: null,
  }
}

// Admin view of a row: never exposes token_hash; adds the token state, the builder name, whether
// the package has a STEP, and the server-built Configuration rows.
export function toAdminCadRequest(row: CadRequestRow, now: Date = new Date()) {
  const { token_hash: _omit, ...rest } = row
  return {
    ...rest,
    builder_title: builderTitle(row.builder_type),
    has_step: builderHasStep(row.builder_type),
    ...configurationView(row.configuration, row.builder_type),
    token: tokenState(row, now),
  }
}

// --- Patches for the staff actions ---------------------------------------
// The subscriber runs the `pending` path for both events, and the hourly job re-runs `pending` rows
// older than 10 minutes, so putting the row back to `pending` means a lost event is still
// recovered.

export function releasePatch(row: CadRequestRow, by: string | null, now: Date) {
  return {
    id: row.id,
    status: "pending" as const,
    error: null,
    // Generate now / Release now on a Queued request records who released it. A Retry of a
    // failed request keeps its original release data (if any).
    ...(row.status === "queued" ? { released_at: now, released_by: by } : {}),
  }
}

export function rejectPatch(row: CadRequestRow, staffNotes: string | null | undefined) {
  return {
    id: row.id,
    status: "rejected" as const,
    reject_reason: "other" as const,
    counted: false, // rejected requests do not count toward the allowance
    token_hash: null,
    token_expires_at: null,
    ...(staffNotes !== undefined ? { staff_notes: staffNotes } : {}),
  }
}

// Resend: the old link stops working at once (token cleared), and the pending path issues a new
// token and emails it again.
export function resendPatch(row: CadRequestRow) {
  return {
    id: row.id,
    status: "pending" as const,
    token_hash: null,
    token_expires_at: null,
    download_count: 0,
    last_downloaded_at: null,
    error: null,
  }
}

/**
 * Mark spam (Sanitube Phase 5, single row): rejected + reject_reason spam, the emailed link stops
 * working, `counted` unchanged (spam must not free the spammer's allowance), an audit line is
 * appended to the notes. Skipped for signed-in customers' requests and `ready` rows ("customer")
 * and rows already marked spam ("already").
 */
export function spamPatch(
  row: Pick<CadRequestRow, "id" | "status" | "is_customer" | "reject_reason" | "staff_notes">,
  ctx: { now: Date; actor: string | null },
): { skip: "customer" | "already" } | { patch: Record<string, unknown> } {
  if (row.is_customer || row.status === "ready") return { skip: "customer" }
  if (row.status === "rejected" && row.reject_reason === "spam") return { skip: "already" }
  const line = `[${ctx.now.toISOString().slice(0, 10)}] Marked spam${ctx.actor ? ` by ${ctx.actor}` : ""}`
  return {
    patch: {
      id: row.id,
      status: "rejected",
      reject_reason: "spam",
      token_hash: null,
      token_expires_at: null,
      staff_notes: row.staff_notes ? `${row.staff_notes}\n${line}` : line,
    },
  }
}

export function spamConflict(reason: "customer" | "already"): string {
  return reason === "customer"
    ? "A signed-in customer's CAD Request cannot be marked as spam."
    : "This CAD Request is already marked as spam."
}

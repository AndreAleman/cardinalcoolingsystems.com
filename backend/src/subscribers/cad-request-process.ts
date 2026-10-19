// CAD Request processing (ported from Sanitube's subscriber; plan B7, CAD Review on).
//
// Handles two events:
//   cad_request.created  {id}       (POST /store/cad-requests, admin Resend)
//     pending  → ensure the CAD Package → (review on) status "review": requester notice + one staff
//                "review" alert; (review off) token → link email → "emailed" + staff "new" alert
//                (visitors only). On failure → "failed", attempts += 1, staff "failed" alert; the
//                requester gets nothing yet and the hourly job retries.
//     queued   → "we're preparing your files" to the requester (1 h cooldown per email) + one
//                staff "queued" alert per request.
//     blocked  → email_allowance: staff "allowance_reached" alert, once per email per 24 h.
//                ip_daily: nothing (noise; visible in admin).
//   cad_request.released {id, by}   (admin Generate now / Release now / Retry, or the queue job)
//     queued/failed → pending with released_at/by → the pending path above.
//     Released requests never count against the site-wide cap.
//
// CAD Review (Sanitube docs/cpq-cad-review-plan.md R1–R11), while `require_review` is on: the
// pending path generates the package and stops at "review" (no token, no link). Staff "Approve &
// send" (approveCadRequest) sets approved_at/by and runs the pending path again, which then issues
// the token and emails the link. Resends and requests approved before skip review. A settings read
// error counts as review on.
//
// The processing functions are exported (with injected deps) so the queue job can call them
// directly and the unit tests can run them with fakes.
//
// No notification module locally (no RESEND_API_KEY): the link and the alerts are logged instead
// (with their recipients) when NODE_ENV !== "production", and the request still moves on.

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { CadRequestAlertKind, CadRequestAlertProps } from "../modules/email-notifications/templates/cad-request-alert"
import type { CadConfigurationRow } from "../modules/email-notifications/templates/cad-request-rows"
import { shouldSend } from "../utils/email-cooldown"
import { builderHasStep, builderTitle, storedBuilderOptions, type ParsedBuilderOptions } from "../lib/cad/builder-options"
import { capDayFor } from "../lib/cad/business-day"
import {
  adminUrl,
  cadDownloadUrl,
  cadEmailFromContainer,
  cadRequestRecipients,
  storefrontUrl,
  type CadEmailLike,
} from "../lib/cad/cad-email"
import { ensurePackageForRequest } from "../lib/cad/ensure-package"

// CAD_REQUEST_MODULE = "cad_request", resolved by key so this file only depends on the service
// methods it calls (CadRequestServiceLike).
export const CAD_REQUEST_MODULE_KEY = "cad_request"

export const EMAIL_ALLOWANCE_LIMIT = 10
export const EMAIL_ALLOWANCE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
export const MAX_ATTEMPTS = 3 // the job stops retrying at 3 failed attempts
export const LINK_VALID_DAYS = 7

// Cooldowns. The link email has none: it is the product, and the 10-per-30-days CAD Allowance
// already caps it.
const NEW_ALERT_COOLDOWN_MS = 10 * 60 * 1000 // per requester email
const NEW_ALERT_GLOBAL_MAX = 30 // per rolling hour
const NEW_ALERT_GLOBAL_WINDOW_MS = 60 * 60 * 1000
const ALLOWANCE_ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000 // per email
const QUEUED_ALERT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // per request (≈ once)
const FAILED_ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000 // per request
const QUEUED_REPLY_COOLDOWN_MS = 60 * 60 * 1000 // per requester email
const REVIEW_ALERT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // per request (≈ once)

// ---------------------------------------------------------------- types

export type CadRequestStatus = "pending" | "queued" | "review" | "emailed" | "ready" | "failed" | "rejected" | "blocked"

// The CadRequest fields this file reads.
export type CadRequestRecord = {
  id: string
  display_id: number
  status: CadRequestStatus
  builder_type: string
  configuration: Record<string, unknown> | null
  part_number: string
  description: string
  is_customer: boolean
  customer_id?: string | null
  contact_name?: string | null
  company_name?: string | null
  email?: string | null
  client_ip?: string | null
  ip_source?: string | null
  source_page?: string | null
  block_reason?: "email_allowance" | "ip_daily" | null
  package_id?: string | null
  queued_at?: Date | string | null
  released_at?: Date | string | null
  released_by?: string | null
  approved_at?: Date | string | null
  approved_by?: string | null
  attempts?: number | null
  created_at?: Date | string | null
}

// The cad_request module service methods used here.
export type CadRequestServiceLike = {
  retrieveCadRequest(id: string): Promise<CadRequestRecord>
  listCadRequests(filters: Record<string, unknown>, config?: Record<string, unknown>): Promise<CadRequestRecord[]>
  updateCadRequests(data: { id: string } & Record<string, unknown>): Promise<unknown>
  issueToken(requestId: string, ttlHours?: number): Promise<{ token: string; expires_at: Date }>
  countEmailRequests(email: string, since: Date): Promise<number>
  countCapGenerations(capDay: string): Promise<number>
  getSettings(): Promise<{ daily_generation_cap: number; require_review?: boolean | null }>
  listQueuedDue(now: Date): Promise<CadRequestRecord[]>
}

type LoggerLike = {
  info(msg: string): void
  warn(msg: string): void
  error(msg: string): void
}

export type CadProcessDeps = {
  cad: CadRequestServiceLike
  email: CadEmailLike | null // null = no notification module (local)
  logger: LoggerLike
  // Generate (or reuse) the CAD Package for a stored request. Never counts against the cap:
  // admission reserves the cap slot on the package row itself, and released requests are free.
  ensurePackage(req: CadRequestRecord): Promise<{ id: string }>
  capDayFor(now: Date): string
  /** A visitor email that belongs to a customer account (shown on staff alerts). */
  isExistingCustomer(email: string): Promise<boolean>
  now(): Date
  isProduction: boolean
}

export type ProcessOutcome = "emailed" | "review" | "failed" | "queued_notified" | "allowance_alerted" | "skipped"

// ---------------------------------------------------------------- helpers

const inFlight = new Set<string>()
const globalNewAlertTimes: number[] = []

function allowGlobalNewAlert(now: number): boolean {
  while (globalNewAlertTimes.length && now - globalNewAlertTimes[0] >= NEW_ALERT_GLOBAL_WINDOW_MS) {
    globalNewAlertTimes.shift()
  }
  if (globalNewAlertTimes.length >= NEW_ALERT_GLOBAL_MAX) return false
  globalNewAlertTimes.push(now)
  return true
}

export function cadReference(req: Pick<CadRequestRecord, "display_id">): string {
  return `CAD-${req.display_id}`
}

/** CAD Review R1: is staff review on? A settings read error counts as on (never skip by accident). */
export async function reviewRequired(deps: Pick<CadProcessDeps, "cad" | "logger">): Promise<boolean> {
  try {
    const settings = await deps.cad.getSettings()
    return settings?.require_review !== false
  } catch (err) {
    deps.logger.warn(`[cad] could not read require_review (treating as on): ${(err as Error).message}`)
    return true
  }
}

function firstName(full?: string | null): string | undefined {
  const t = (full || "").trim()
  if (!t) return undefined
  const space = t.indexOf(" ")
  return space < 0 ? t : t.slice(0, space)
}

function parseConfig(req: CadRequestRecord): ParsedBuilderOptions | null {
  return storedBuilderOptions(req.builder_type, req.configuration)
}

/** The builder's display rows, or the raw stored key/value pairs as a fallback for bad data. */
export function configurationRows(req: Pick<CadRequestRecord, "configuration">, parsed: ParsedBuilderOptions | null): CadConfigurationRow[] {
  if (parsed) return parsed.builder.display(parsed.options)
  return Object.entries(req.configuration ?? {})
    .filter(([, v]) => v != null && typeof v !== "object")
    .map(([k, v]) => ({ label: k, value: String(v) }))
}

async function sendAlert(
  deps: CadProcessDeps,
  kind: CadRequestAlertKind,
  req: CadRequestRecord,
  extra: Partial<CadRequestAlertProps> = {},
): Promise<void> {
  const parsed = parseConfig(req)
  const now = deps.now()
  const props: CadRequestAlertProps = {
    kind,
    reference: cadReference(req),
    builderTitle: builderTitle(req.builder_type) || undefined,
    contactName: req.contact_name || undefined,
    companyName: req.company_name || undefined,
    email: req.email || undefined,
    isCustomer: !!req.is_customer,
    partNumber: req.part_number,
    description: req.description,
    configuration: configurationRows(req, parsed),
    clientIp: req.client_ip || undefined,
    ipSource: req.ip_source || undefined,
    sourcePage: req.source_page || undefined,
    reviewUrl: adminUrl(`/cad-requests/${req.id}`),
    releaseUrl: kind === "queued" ? adminUrl(`/cad-requests/${req.id}`) : undefined,
    ...extra,
  }
  // Counters and the customer match are nice-to-have: never block the alert.
  try {
    if (!req.is_customer && req.email) {
      const used = await deps.cad.countEmailRequests(req.email, new Date(now.getTime() - EMAIL_ALLOWANCE_WINDOW_MS))
      props.emailRequests30d = { used, limit: EMAIL_ALLOWANCE_LIMIT }
    }
    const [used, settings] = await Promise.all([deps.cad.countCapGenerations(deps.capDayFor(now)), deps.cad.getSettings()])
    props.generationsToday = { used, cap: settings.daily_generation_cap }
  } catch (err) {
    deps.logger.warn(`[cad] alert counters unavailable for ${req.id}: ${(err as Error).message}`)
  }
  try {
    if (!req.is_customer && req.email) props.existingCustomer = await deps.isExistingCustomer(req.email)
  } catch {
    // ignore
  }

  const to = cadRequestRecipients()
  if (!deps.email) {
    deps.logger.info(
      `[cad] staff ${kind} alert for ${cadReference(req)} → ${to.join(", ")} (no notification module; not sent)`,
    )
    return
  }
  try {
    await deps.email.sendCadRequestAlert(to, props)
  } catch (err) {
    deps.logger.warn(`[cad] staff ${kind} alert failed for ${req.id}: ${(err as Error).message}`)
  }
}

/**
 * Staff may mark a request spam or reject it while its package is generating. Re-read the status
 * before each step that would reach the requester or overwrite the status. A read error proceeds
 * as before (the row was just read successfully).
 */
async function rejectedMidway(deps: CadProcessDeps, req: CadRequestRecord, step: string): Promise<boolean> {
  try {
    const fresh = await deps.cad.retrieveCadRequest(req.id)
    if (fresh?.status !== "rejected") return false
  } catch (err) {
    deps.logger.warn(`[cad] status re-check for ${req.id} failed: ${(err as Error).message}`)
    return false
  }
  deps.logger.info(`[cad] ${cadReference(req)} was rejected during processing; stopped ${step}`)
  return true
}

async function markFailed(deps: CadProcessDeps, req: CadRequestRecord, message: string): Promise<ProcessOutcome> {
  // A request rejected mid-generation stays rejected: as `failed` the hourly job would retry it.
  if (await rejectedMidway(deps, req, "before marking it failed")) return "skipped"
  const attempts = (req.attempts ?? 0) + 1
  try {
    await deps.cad.updateCadRequests({ id: req.id, status: "failed", attempts, error: message.slice(0, 2000) })
  } catch (err) {
    deps.logger.error(`[cad] could not mark ${req.id} failed: ${(err as Error).message}`)
  }
  deps.logger.warn(`[cad] ${cadReference(req)} failed (attempt ${attempts}): ${message}`)
  if (shouldSend(`cad-request:alert:failed:${req.id}`, FAILED_ALERT_COOLDOWN_MS)) {
    await sendAlert(deps, "failed", { ...req, attempts }, { error: message, attempts })
  }
  return "failed"
}

// ---------------------------------------------------------------- paths

/**
 * Pending path: ensure the CAD Package, then (review on, not approved, not a resend) stop at
 * review; otherwise issue a token and email the link. Also used for retries of failed requests.
 */
export async function deliverCadRequest(
  deps: CadProcessDeps,
  req: CadRequestRecord,
  opts: { resend?: boolean } = {},
): Promise<ProcessOutcome> {
  if (req.status !== "pending" && req.status !== "failed") return "skipped"
  if (inFlight.has(req.id)) return "skipped"
  inFlight.add(req.id)
  try {
    const parsed = parseConfig(req)
    if (!parsed) return await markFailed(deps, req, "Stored configuration is invalid")

    const released = !!req.released_at
    const now = deps.now()

    let packageId: string
    let token: string
    try {
      const pkg = await deps.ensurePackage(req)
      packageId = pkg.id
      // Rejected (or marked spam) while generating → no token, no link.
      if (await rejectedMidway(deps, req, "before issuing a token")) return "skipped"
      // CAD Review: a request staff haven't approved stops here (R2, R11). Resends are
      // already-delivered requests, so they skip review.
      if (!opts.resend && !req.approved_at && (await reviewRequired(deps))) {
        return await moveToReview(deps, req, packageId)
      }
      token = (await deps.cad.issueToken(req.id)).token
    } catch (err) {
      return await markFailed(deps, req, (err as Error).message || "CAD generation failed")
    }

    const url = cadDownloadUrl(token)
    if (!req.email) return await markFailed(deps, req, "No email address on the request")

    // Rejected between the first check and issueToken: the new token must not stay usable.
    if (await rejectedMidway(deps, req, "before sending the link")) {
      await deps.cad.updateCadRequests({ id: req.id, token_hash: null, token_expires_at: null })
      return "skipped"
    }

    if (deps.email) {
      try {
        await deps.email.sendCadRequestLink(req.email, {
          reference: cadReference(req),
          contactName: firstName(req.contact_name),
          partNumber: req.part_number,
          description: req.description,
          configuration: configurationRows(req, parsed),
          downloadUrl: url,
          quoteUrl: storefrontUrl(parsed.builder.sharePath(parsed.options)),
          validDays: LINK_VALID_DAYS,
          hasStep: builderHasStep(req.builder_type),
        })
      } catch (err) {
        return await markFailed(deps, req, `Download link email failed: ${(err as Error).message}`)
      }
    } else if (!deps.isProduction) {
      deps.logger.info(`[cad] download link for ${cadReference(req)} → ${req.email}: ${url}`)
    } else {
      deps.logger.warn(`[cad] no notification module; download link for ${cadReference(req)} not sent`)
    }

    // Rejected while the email was going out: keep it rejected and send no staff alert.
    if (await rejectedMidway(deps, req, "after sending the link")) return "skipped"

    await deps.cad.updateCadRequests({ id: req.id, status: "emailed", emailed_at: now, package_id: packageId, error: null })

    // Staff "new" alert (review off): visitor requests only. A released request already produced
    // a "queued" alert, a Resend is not a new request, and an approved request was just sent by
    // staff themselves (R9).
    if (!req.is_customer && !released && !opts.resend && !req.approved_at) {
      const key = (req.email || req.id).toLowerCase()
      if (!shouldSend(`cad-request:alert:new:${key}`, NEW_ALERT_COOLDOWN_MS)) {
        deps.logger.warn(`[cad] new alert for ${req.id} suppressed (per-email cooldown)`)
      } else if (!allowGlobalNewAlert(Date.now())) {
        deps.logger.warn(`[cad] new alert for ${req.id} suppressed (global flood guard)`)
      } else {
        await sendAlert(deps, "new", req)
      }
    }
    return "emailed"
  } finally {
    inFlight.delete(req.id)
  }
}

/** The requester's "we're preparing your CAD files" notice (1 h cooldown per email; R8). */
async function sendRequesterNotice(deps: CadProcessDeps, req: CadRequestRecord, review: boolean): Promise<void> {
  const email = (req.email || "").toLowerCase()
  if (!email) return
  if (!deps.email) {
    if (!deps.isProduction) {
      deps.logger.info(
        `[cad] ${cadReference(req)} ${review ? "awaiting review" : "queued"}; requester notice${
          review ? " (review copy)" : ""
        } to ${email} not sent (no notification module)`,
      )
    }
    return
  }
  if (!shouldSend(`cad-request:queued:${email}`, QUEUED_REPLY_COOLDOWN_MS)) {
    deps.logger.warn(`[cad] queued notice to ${req.email} suppressed (cooldown)`)
    return
  }
  try {
    await deps.email.sendCadRequestQueued(req.email!, {
      reference: cadReference(req),
      contactName: firstName(req.contact_name),
      partNumber: req.part_number,
      description: req.description,
      configuration: configurationRows(req, parseConfig(req)),
      ...(review ? { review: true } : {}),
    })
  } catch (err) {
    deps.logger.warn(`[cad] queued notice failed for ${req.id}: ${(err as Error).message}`)
  }
}

async function notifyQueued(deps: CadProcessDeps, req: CadRequestRecord): Promise<ProcessOutcome> {
  const review = await reviewRequired(deps)
  await sendRequesterNotice(deps, req, review)
  if (shouldSend(`cad-request:alert:queued:${req.id}`, QUEUED_ALERT_COOLDOWN_MS)) {
    await sendAlert(deps, "queued", req, review ? { review: true } : {})
  }
  return "queued_notified"
}

/**
 * CAD Review R2: the package is ready; the request waits for staff. No token is issued. The
 * requester is told (unless they already were when it was queued) and staff get one "review"
 * alert per request (R9).
 */
async function moveToReview(deps: CadProcessDeps, req: CadRequestRecord, packageId: string): Promise<ProcessOutcome> {
  await deps.cad.updateCadRequests({ id: req.id, status: "review", package_id: packageId, error: null })
  deps.logger.info(`[cad] ${cadReference(req)} is awaiting review (package ${packageId})`)
  if (!req.queued_at) await sendRequesterNotice(deps, req, true)
  if (shouldSend(`cad-request:alert:review:${req.id}`, REVIEW_ALERT_COOLDOWN_MS)) {
    await sendAlert(deps, "review", req)
  }
  return "review"
}

async function notifyBlocked(deps: CadProcessDeps, req: CadRequestRecord): Promise<ProcessOutcome> {
  if (req.block_reason !== "email_allowance" || !req.email) return "skipped"
  const email = req.email.toLowerCase()
  if (!shouldSend(`cad-request:alert:allowance:${email}`, ALLOWANCE_ALERT_COOLDOWN_MS)) return "skipped"
  await sendAlert(deps, "allowance_reached", req)
  return "allowance_alerted"
}

/** cad_request.created */
export async function handleCadRequestCreated(
  deps: CadProcessDeps,
  id: string,
  opts: { resend?: boolean } = {},
): Promise<ProcessOutcome> {
  const req = await deps.cad.retrieveCadRequest(id)
  if (!req) return "skipped"
  switch (req.status) {
    case "pending":
      // Also admin "Resend link" (created {id, resend: true}).
      return deliverCadRequest(deps, req, opts)
    case "queued":
      return notifyQueued(deps, req)
    case "blocked":
      return notifyBlocked(deps, req)
    default:
      return "skipped" // review / emailed / ready / failed / rejected: nothing to do
  }
}

/**
 * cad_request.released (admin Generate now / Release now / Retry, or the queue job). A still-Queued
 * row is moved to pending with released_at/by here (the job path; the admin route patches it
 * itself). A pending or failed row is delivered as-is.
 */
export async function releaseCadRequest(deps: CadProcessDeps, id: string, by: string = "auto"): Promise<ProcessOutcome> {
  let req = await deps.cad.retrieveCadRequest(id)
  if (!req) return "skipped"
  if (req.status !== "queued" && req.status !== "failed" && req.status !== "pending") return "skipped"
  if (req.status === "queued") {
    const patch = { status: "pending" as const, released_at: deps.now(), released_by: by }
    await deps.cad.updateCadRequests({ id: req.id, ...patch })
    req = { ...req, ...patch }
  }
  return deliverCadRequest(deps, req)
}

/**
 * CAD Review R3: staff "Approve & send". Only a request in `review`; records approved_at/by, then
 * the pending path issues the token and emails the link (→ emailed). If sending fails the row is
 * `failed` with approved_at set, so the hourly retry sends it without another review (R11).
 */
export async function approveCadRequest(deps: CadProcessDeps, id: string, by: string | null): Promise<ProcessOutcome> {
  const req = await deps.cad.retrieveCadRequest(id)
  if (!req || req.status !== "review") return "skipped"
  const patch = { status: "pending" as const, approved_at: deps.now(), approved_by: by }
  await deps.cad.updateCadRequests({ id: req.id, ...patch })
  return deliverCadRequest(deps, { ...req, ...patch })
}

/** Job retry of a failed (or stuck pending) request; no release semantics. */
export async function retryCadRequest(deps: CadProcessDeps, id: string): Promise<ProcessOutcome> {
  const req = await deps.cad.retrieveCadRequest(id)
  if (!req) return "skipped"
  if (req.status === "failed" && (req.attempts ?? 0) >= MAX_ATTEMPTS) return "skipped"
  return deliverCadRequest(deps, req)
}

// ---------------------------------------------------------------- wiring

export function buildCadProcessDeps(container: MedusaContainer): CadProcessDeps {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as LoggerLike
  const cad = container.resolve(CAD_REQUEST_MODULE_KEY) as unknown as CadRequestServiceLike
  return {
    cad,
    email: cadEmailFromContainer(container),
    logger,
    ensurePackage: (req) =>
      ensurePackageForRequest(container, {
        builder_type: req.builder_type,
        configuration: req.configuration ?? {},
        part_number: req.part_number,
        description: req.description,
      }),
    capDayFor,
    isExistingCustomer: async (email) => {
      const customers = container.resolve(Modules.CUSTOMER) as {
        listCustomers(filters: Record<string, unknown>, config?: Record<string, unknown>): Promise<unknown[]>
      }
      const rows = await customers.listCustomers({ email: email.trim().toLowerCase(), has_account: true }, { take: 1 })
      return rows.length > 0
    },
    now: () => new Date(),
    isProduction: process.env.NODE_ENV === "production",
  }
}

export default async function cadRequestProcess({
  event,
  container,
}: SubscriberArgs<{ id: string; by?: string | null; resend?: boolean }>) {
  const id = event.data?.id
  if (!id) return
  const deps = buildCadProcessDeps(container)
  try {
    if (event.name === "cad_request.released") {
      await releaseCadRequest(deps, id, event.data.by || "auto")
    } else {
      await handleCadRequestCreated(deps, id, { resend: !!event.data.resend })
    }
  } catch (err) {
    deps.logger.error(`[cad] processing ${event.name} for ${id} failed: ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["cad_request.created", "cad_request.released"],
}

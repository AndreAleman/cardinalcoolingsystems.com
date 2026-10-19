// POST /store/cad-requests: create a CAD Request (Cardinal Builder plan B7; ported from Sanitube).
//
// Body: { builder_type, options, name, company, email, website (honeypot), turnstile_token?,
//         elapsed_ms?, source_page? }. Bot protection (rate limit, honeypot, Turnstile) runs in
// ./middlewares.ts before this.
//
// Visitor: gate (name, company, Business Email) → Standard Range → CAD Allowance admission →
//   CadRequest (counted) → event `cad_request.created`. Generation and the emails happen in the
//   subscriber, so this responds fast. Blocked requests are recorded (not counted) and also emit
//   `cad_request.created` (the subscriber alerts staff on email_allowance).
// Customer (signed in): no gate, not counted, no cap.
// CAD Review on (default): both answer `outcome: "review"` with the email the link will go to; the
//   subscriber generates the package and the request waits for staff approval (a queued visitor
//   request also answers "review": the link follows after approval either way). Review off =
//   Sanitube Phase 3: visitor "emailed" | "queued", customer "ready" (instant download) or
//   "emailed" (generation took longer than 45 s).
//
// Responses:
//   201 { ok, outcome: "review", cad_request: {id, display_id}, part_number, email }
//   201 { ok, outcome: "queued" | "emailed", cad_request, part_number }                 (review off)
//   201 { ok, outcome: "ready", cad_request, part_number, download: {token, expires_at, files} }
//   429 { type: "cad_allowance", code: "email_allowance" | "ip_daily", outcome: "blocked", message }
//   400 { type: "invalid_data", code: "outside_standard_range", message } / Medusa invalid_data
//   503 { type: "cad_unavailable", message }

import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { CAD_ALLOWANCE_MESSAGES, admitCadRequest } from "../../../lib/cad/admission"
import { parseBuilderOptions, type ParsedBuilderOptions } from "../../../lib/cad/builder-options"
import { PART_NUMBER_RE } from "../../../lib/cad/cache-key"
import { cadServiceEnabled } from "../../../lib/cad/cad-service-client"
import { cadFiles } from "../../../lib/cad/download"
import { ensureCadPackage } from "../../../lib/cad/ensure-package"
import { CAD_REQUEST_MODULE } from "../../../modules/cad-request"
import type CadRequestModuleService from "../../../modules/cad-request/service"
import type { CadRequestDTO } from "../../../modules/cad-request/types"
import { assertBusinessEmail } from "../../../utils/business-email"
import { cadClientIp } from "./helpers"
import type { StoreCreateCadRequestType } from "./validators"

/** Signed-in customers wait this long for generation (review off) before the link is emailed. */
export const CUSTOMER_SYNC_TIMEOUT_MS = 45_000

export const CAD_UNAVAILABLE_MESSAGE = "CAD downloads are temporarily unavailable."
export const OUTSIDE_STANDARD_RANGE_MESSAGE =
  "This configuration needs engineering review, so CAD files aren't available. Request a quote instead."

async function emit(req: AuthenticatedMedusaRequest, name: string, data: Record<string, unknown>) {
  try {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)
    await eventBus.emit({ name, data })
  } catch {
    // event bus unavailable: the queue job re-runs pending rows
  }
}

/** CAD Review R1; a settings read error counts as on (never skip review by accident). */
async function reviewOn(service: Pick<CadRequestModuleService, "requireReview">): Promise<boolean> {
  try {
    return await service.requireReview()
  } catch {
    return true
  }
}

function summary(row: { id: string; display_id: number }) {
  return { id: row.id, display_id: row.display_id }
}

export const POST = async (req: AuthenticatedMedusaRequest<StoreCreateCadRequestType>, res: MedusaResponse) => {
  const body = req.validatedBody
  const customerId = req.auth_context?.actor_type === "customer" ? req.auth_context.actor_id || null : null
  const isCustomer = !!customerId

  // Configuration (hard limits) first: the response needs the Part Number.
  const parsed = parseBuilderOptions(body.builder_type, body.options)
  if (parsed.ok === false) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, (parsed as { errors: string[] }).errors.join("; "))
  }
  const { type, builder, options } = (parsed as { value: ParsedBuilderOptions }).value

  const service = req.scope.resolve<CadRequestModuleService>(CAD_REQUEST_MODULE)
  const review = await reviewOn(service)

  if (!cadServiceEnabled()) {
    return res.status(503).json({ type: "cad_unavailable", message: CAD_UNAVAILABLE_MESSAGE })
  }

  // Gate (visitors only).
  let contactName: string | null = null
  let companyName: string | null = null
  let email: string | null = null
  if (!isCustomer) {
    contactName = (body.name ?? "").trim() || null
    companyName = (body.company ?? "").trim() || null
    email = (body.email ?? "").trim().toLowerCase() || null
    if (!contactName || !companyName || !email) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Name, company and email are required.")
    }
    assertBusinessEmail(email)
  }

  // Standard Range: outside → no CAD Package, nothing recorded (the quote path handles it).
  if (!builder.standardRange(options).ok) {
    return res.status(400).json({
      type: "invalid_data",
      code: "outside_standard_range",
      message: OUTSIDE_STANDARD_RANGE_MESSAGE,
    })
  }

  const partNumber = builder.partNumber(options)
  if (!PART_NUMBER_RE.test(partNumber)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "This configuration has no file-safe Part Number.")
  }
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const now = new Date()
  const base = {
    builder_type: type,
    configuration: options as Record<string, unknown>,
    config_key: builder.configKey(options),
    part_number: partNumber,
    description: builder.describe(options),
    source_page: body.source_page ?? null,
  }

  if (isCustomer) {
    return handleCustomer(req, res, { service, logger, customerId: customerId!, base, now, review, type, options, partNumber })
  }

  // Visitor admission.
  const { ip, source } = cadClientIp(req)
  if (source !== "forwarded" && source !== "cf") {
    logger.info(`[cad] IP limit skipped: untrusted client IP source "${source}" (${ip ?? "unknown"})`)
  }
  const admission = await admitCadRequest(req.scope, {
    builderType: type,
    options,
    partNumber,
    isCustomer: false,
    email,
    ip,
    ipSource: source,
    now,
  })

  const requester = { contact_name: contactName, company_name: companyName, email, client_ip: ip, ip_source: source }

  if (admission.outcome === "block") {
    const reason = admission.blockReason!
    const blocked = (await service.createCadRequests({
      ...base,
      ...requester,
      status: "blocked",
      counted: false,
      block_reason: reason,
    })) as unknown as CadRequestDTO
    // The subscriber sends the staff allowance_reached alert (24 h cooldown); ip_daily blocks are
    // only visible in admin.
    await emit(req, "cad_request.created", { id: blocked.id })
    return res.status(429).json({ type: "cad_allowance", code: reason, outcome: "blocked", message: CAD_ALLOWANCE_MESSAGES[reason] })
  }

  const queued = admission.outcome === "queue"
  const created = (await service.createCadRequests({
    ...base,
    ...requester,
    status: queued ? "queued" : "pending",
    counted: true,
    queued_at: queued ? now : null,
    package_id: admission.reservedPackageId ?? null,
  })) as unknown as CadRequestDTO

  await emit(req, "cad_request.created", { id: created.id })

  return res.status(201).json({
    ok: true,
    outcome: review ? "review" : queued ? "queued" : "emailed",
    cad_request: summary(created),
    part_number: partNumber,
    ...(review ? { email } : {}),
  })
}

async function customerProfile(req: AuthenticatedMedusaRequest, customerId: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name", "company_name", "employee.company.name"],
    filters: { id: customerId },
  })
  const c = customer as any
  return {
    email: String(c?.email ?? "").toLowerCase() || null,
    name: [c?.first_name, c?.last_name].filter(Boolean).join(" ").trim() || null,
    company: c?.employee?.company?.name ?? c?.company_name ?? null,
  }
}

async function handleCustomer(
  req: AuthenticatedMedusaRequest<StoreCreateCadRequestType>,
  res: MedusaResponse,
  ctx: {
    service: CadRequestModuleService
    logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }
    customerId: string
    base: Record<string, unknown>
    now: Date
    review: boolean
    type: string
    options: Record<string, unknown>
    partNumber: string
  },
) {
  const { service, logger, customerId, base, review, partNumber } = ctx
  const profile = await customerProfile(req, customerId)

  const created = (await service.createCadRequests({
    ...(base as any),
    is_customer: true,
    customer_id: customerId,
    email: profile.email,
    contact_name: profile.name,
    company_name: profile.company,
    status: "pending",
    counted: false,
  })) as unknown as CadRequestDTO

  // CAD Review R7: no instant download. The subscriber generates the package (not counted, no
  // cap) and the request waits for staff approval; the link then goes to the account email.
  if (review) {
    await emit(req, "cad_request.created", { id: created.id })
    return res.status(201).json({
      ok: true,
      outcome: "review",
      cad_request: summary(created),
      part_number: partNumber,
      email: created.email ?? null,
    })
  }

  // Review off: generate now. Generation keeps running after the timeout; the subscriber then
  // reuses it (same in-process promise / cached package) and emails the link.
  const generation = ensureCadPackage(req.scope, {
    builderType: ctx.type as any,
    options: ctx.options as any,
    partNumber,
    countAgainstCap: false,
  })
  const TIMEOUT = Symbol("timeout")
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<typeof TIMEOUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMEOUT), CUSTOMER_SYNC_TIMEOUT_MS)
  })

  let pkg
  try {
    const raced = await Promise.race([generation, timeout])
    if (raced === TIMEOUT) {
      generation.catch(() => undefined)
      await emit(req, "cad_request.created", { id: created.id })
      return res.status(201).json({ ok: true, outcome: "emailed", cad_request: summary(created), part_number: partNumber })
    }
    pkg = raced
  } catch (err: any) {
    logger.error(`[cad] customer CAD Request ${created.id} failed: ${err?.message ?? err}`)
    await service.updateCadRequests({
      id: created.id,
      status: "failed",
      attempts: 1,
      error: String(err?.message ?? err).slice(0, 2000),
    })
    return res.status(503).json({ type: "cad_unavailable", message: CAD_UNAVAILABLE_MESSAGE })
  } finally {
    if (timer) clearTimeout(timer)
  }

  const { token, expires_at } = await service.issueToken(created.id)
  await service.updateCadRequests({ id: created.id, status: "ready", package_id: pkg.id })

  return res.status(201).json({
    ok: true,
    outcome: "ready",
    cad_request: summary(created),
    part_number: partNumber,
    download: { token, expires_at: expires_at.toISOString(), files: cadFiles(partNumber, pkg) },
  })
}

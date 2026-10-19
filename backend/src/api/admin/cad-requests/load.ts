import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { getCadServiceHealth } from "../../../lib/cad/cad-service-client"
import { easternDay, toAdminCadRequest } from "./helpers"
import { CAD_REQUEST_MODULE, type CadRequestAdminService, type CadRequestRow } from "./module"

export function cadService(scope: MedusaContainer): CadRequestAdminService {
  return scope.resolve<CadRequestAdminService>(CAD_REQUEST_MODULE)
}

export async function loadCadRequestRow(scope: MedusaContainer, id: string): Promise<CadRequestRow> {
  const [row] = await cadService(scope).listCadRequests({ id }, { take: 1 })
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `CAD Request "${id}" not found`)
  }
  return row
}

export async function loadAdminCadRequest(scope: MedusaContainer, id: string) {
  return toAdminCadRequest(await loadCadRequestRow(scope, id))
}

export async function emitCadEvent(
  scope: MedusaContainer,
  name: "cad_request.created" | "cad_request.released",
  data: Record<string, unknown>,
) {
  const eventBus = scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({ name, data })
}

// GET/POST /admin/cad-settings response.
export async function buildCadSettingsResponse(scope: MedusaContainer, now: Date = new Date()) {
  const service = cadService(scope)
  const capDay = easternDay(now)
  const [settings, generated, [, queued], [, review], status] = await Promise.all([
    service.getSettings(),
    service.countCapGenerations(capDay),
    service.listAndCountCadRequests({ status: "queued" }, { take: 1 }),
    service.listAndCountCadRequests({ status: "review" }, { take: 1 }),
    getCadServiceHealth({ timeoutMs: 2000 }),
  ])
  return {
    daily_generation_cap: settings.daily_generation_cap,
    // CAD Review R1: on unless staff turned it off.
    require_review: settings.require_review !== false,
    updated_by: settings.updated_by ?? null,
    // `review` = requests awaiting review (all, not only today's), like `queued`.
    today: { cap_day: capDay, generated, queued, review },
    service: status,
  }
}

const HISTORY_SELECT = ["id", "display_id", "status", "builder_type", "part_number", "description", "is_customer", "created_at"]

/** Other CAD Requests from the same email, newest first (Cardinal has no Lead module). */
export async function cadRequestHistory(scope: MedusaContainer, email: string | null | undefined) {
  if (!email) return []
  return cadService(scope).listCadRequests(
    { email: email.trim().toLowerCase() },
    { take: 100, order: { created_at: "DESC" }, select: HISTORY_SELECT },
  )
}

export type AdminCadCustomer = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
}

/** Customer names for requests made by signed-in customers. */
export async function customersById(scope: MedusaContainer, ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((x): x is string => !!x))]
  const map = new Map<string, AdminCadCustomer>()
  if (!unique.length) return map
  const customers = await scope.resolve(Modules.CUSTOMER).listCustomers({ id: unique }, { take: unique.length })
  for (const c of customers as any[]) {
    map.set(c.id, {
      id: c.id,
      email: c.email,
      first_name: c.first_name ?? null,
      last_name: c.last_name ?? null,
      company_name: c.company_name ?? null,
    })
  }
  return map
}

/** A visitor email that matches a customer account (shown on the detail page). */
export async function customerByEmail(scope: MedusaContainer, email: string | null | undefined) {
  if (!email) return null
  const [c] = (await scope
    .resolve(Modules.CUSTOMER)
    .listCustomers({ email: email.trim().toLowerCase(), has_account: true }, { take: 1 })) as any[]
  return c ? { id: c.id as string, email: c.email as string } : null
}

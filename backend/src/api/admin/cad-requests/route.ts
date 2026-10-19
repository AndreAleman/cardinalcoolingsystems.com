import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildListFilters, toAdminCadRequest } from "./helpers"
import { cadService, customersById } from "./load"
import type { AdminListCadRequestsParamsType } from "./validators"

// GET /admin/cad-requests?status=&builder_type=&q=&email=&reject_reason=&exclude_spam=&limit=&offset=
// CAD Requests, newest first. `status` takes one or several (comma-separated) statuses; `q`
// matches email, company, contact and Part Number (case-insensitive substring).
// → {cad_requests: [row + builder_title, has_step, configuration_display, share_path, token, customer], count, limit, offset}
export const GET = async (req: AuthenticatedMedusaRequest<AdminListCadRequestsParamsType>, res: MedusaResponse) => {
  const v = req.validatedQuery as AdminListCadRequestsParamsType
  const [rows, count] = await cadService(req.scope).listAndCountCadRequests(buildListFilters(v as any), {
    take: v.limit,
    skip: v.offset,
    order: { created_at: "DESC" },
  })
  const now = new Date()
  const customers = await customersById(
    req.scope,
    rows.filter((r) => r.is_customer).map((r) => r.customer_id),
  )
  res.json({
    cad_requests: rows.map((r) => ({
      ...toAdminCadRequest(r, now),
      customer: (r.customer_id && customers.get(r.customer_id)) || null,
    })),
    count,
    limit: v.limit,
    offset: v.offset,
  })
}

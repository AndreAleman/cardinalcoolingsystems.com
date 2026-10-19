import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { toAdminCadRequest } from "../helpers"
import { cadRequestHistory, cadService, customerByEmail, customersById, loadAdminCadRequest, loadCadRequestRow } from "../load"
import type { AdminUpdateCadRequestType } from "../validators"

// GET /admin/cad-requests/:id
//   → {cad_request, package, customer, matched_customer, history: {cad_requests[]},
//      approved_before: {id, display_id, approved_at} | null}
// `approved_before` (CAD Review R6): the most recent other request for the same Part Number whose
// files staff approved. `matched_customer`: a visitor email that belongs to a customer account.
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const scope = req.scope
  const row = await loadCadRequestRow(scope, req.params.id)
  const service = cadService(scope)

  const [packages, history, customers, matched, approvedBefore] = await Promise.all([
    row.package_id ? service.listCadPackages({ id: row.package_id }, { take: 1 }) : Promise.resolve([]),
    cadRequestHistory(scope, row.email),
    customersById(scope, [row.customer_id]),
    row.is_customer ? Promise.resolve(null) : customerByEmail(scope, row.email).catch(() => null),
    service.findApprovedBefore(row.part_number, row.id).catch(() => null),
  ])
  const pkg = (packages as any[])[0] ?? null
  res.json({
    cad_request: toAdminCadRequest(row),
    // Never expose object keys; `has_step` says whether a STEP exists.
    package: pkg
      ? (({ step_key, pdf_key, ...rest }: any) => ({ ...rest, has_step: !!step_key, has_pdf: !!pdf_key }))(pkg)
      : null,
    customer: (row.customer_id && customers.get(row.customer_id)) || null,
    matched_customer: matched,
    history: { cad_requests: history.filter((h) => h.id !== row.id) },
    approved_before: approvedBefore
      ? {
          id: approvedBefore.id,
          display_id: approvedBefore.display_id,
          approved_at: new Date(approvedBefore.approved_at).toISOString(),
        }
      : null,
  })
}

// POST /admin/cad-requests/:id {staff_notes} → {cad_request}. No side effects.
export const POST = async (req: AuthenticatedMedusaRequest<AdminUpdateCadRequestType>, res: MedusaResponse) => {
  const { id } = req.params
  await loadCadRequestRow(req.scope, id)
  await cadService(req.scope).updateCadRequests({ id, staff_notes: req.validatedBody.staff_notes })
  res.json({ cad_request: await loadAdminCadRequest(req.scope, id) })
}

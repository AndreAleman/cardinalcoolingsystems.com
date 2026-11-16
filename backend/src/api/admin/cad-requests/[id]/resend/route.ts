import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { actionConflict, resendPatch } from "../../helpers"
import { cadService, emitCadEvent, loadAdminCadRequest, loadCadRequestRow } from "../../load"

// POST /admin/cad-requests/:id/resend   (Resend link)
// The old link stops working immediately (token cleared). The row goes back to `pending` and
// `cad_request.created {id, resend: true}` runs the pending path: cached package → new token →
// link email → `emailed` (already approved, so no review). 409 unless emailed or ready.
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const row = await loadCadRequestRow(req.scope, id)
  const conflict = actionConflict("resend", row.status)
  if (conflict) return res.status(409).json({ type: "conflict", message: conflict })
  if (!row.email) return res.status(409).json({ type: "conflict", message: "This CAD Request has no email to send to." })
  await cadService(req.scope).updateCadRequests(resendPatch(row))
  await emitCadEvent(req.scope, "cad_request.created", { id, resend: true, by: req.auth_context?.actor_id ?? null })
  res.json({ cad_request: await loadAdminCadRequest(req.scope, id) })
}

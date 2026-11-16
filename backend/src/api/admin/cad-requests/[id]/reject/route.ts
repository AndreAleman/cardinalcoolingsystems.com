import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { actionConflict, rejectPatch } from "../../helpers"
import { cadService, loadAdminCadRequest, loadCadRequestRow } from "../../load"
import type { AdminRejectCadRequestType } from "../../validators"

// POST /admin/cad-requests/:id/reject {staff_notes?}
// Rejects a Queued request or one awaiting review (CAD Review R4). The requester gets nothing, and
// the request stops counting toward their allowance. 409 unless queued or review.
export const POST = async (req: AuthenticatedMedusaRequest<AdminRejectCadRequestType>, res: MedusaResponse) => {
  const { id } = req.params
  const row = await loadCadRequestRow(req.scope, id)
  const conflict = actionConflict("reject", row.status)
  if (conflict) return res.status(409).json({ type: "conflict", message: conflict })
  await cadService(req.scope).updateCadRequests(rejectPatch(row, req.validatedBody?.staff_notes))
  res.json({ cad_request: await loadAdminCadRequest(req.scope, id) })
}

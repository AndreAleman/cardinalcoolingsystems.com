import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { spamConflict, spamPatch } from "../../helpers"
import { cadService, loadAdminCadRequest, loadCadRequestRow } from "../../load"
import type { AdminSpamCadRequestType } from "../../validators"

// POST /admin/cad-requests/:id/spam {staff_notes?}
// rejected + reject_reason spam, the emailed link stops working, `counted` unchanged, no email. A
// row still generating is caught by the subscriber's status re-check. 409 for a signed-in
// customer's request or one already marked spam.
export const POST = async (req: AuthenticatedMedusaRequest<AdminSpamCadRequestType>, res: MedusaResponse) => {
  const { id } = req.params
  const row = await loadCadRequestRow(req.scope, id)
  const staffNotes = req.validatedBody?.staff_notes
  const result = spamPatch(
    { ...row, staff_notes: staffNotes !== undefined ? staffNotes : row.staff_notes },
    { now: new Date(), actor: req.auth_context?.actor_id ?? null },
  )
  if ("skip" in result) return res.status(409).json({ type: "conflict", message: spamConflict(result.skip) })
  await cadService(req.scope).updateCadRequests(result.patch)
  res.json({ cad_request: await loadAdminCadRequest(req.scope, id) })
}

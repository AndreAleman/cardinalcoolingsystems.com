import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { approveCadRequest, buildCadProcessDeps } from "../../../../../subscribers/cad-request-process"
import { actionConflict } from "../../helpers"
import { loadAdminCadRequest, loadCadRequestRow } from "../../load"

// POST /admin/cad-requests/:id/approve   (Approve & send; CAD Review R3)
// Only a request in `review`. Records approved_at / approved_by (admin user id), then runs the
// subscriber's pending path in this request: the package is already generated, so it issues the
// token, emails the link and sets `emailed`. If the send fails the row is `failed` (approved_at
// kept) and the hourly job retries the send without another review (R11). 409 unless review.
// → {cad_request, outcome}
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const row = await loadCadRequestRow(req.scope, id)
  const conflict = actionConflict("approve", row.status)
  if (conflict) return res.status(409).json({ type: "conflict", message: conflict })
  if (!row.email) return res.status(409).json({ type: "conflict", message: "This CAD Request has no email to send to." })
  const by = req.auth_context?.actor_id ?? null
  const outcome = await approveCadRequest(buildCadProcessDeps(req.scope), id, by)
  res.json({ cad_request: await loadAdminCadRequest(req.scope, id), outcome })
}

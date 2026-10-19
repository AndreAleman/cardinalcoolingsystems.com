import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { actionConflict, releasePatch } from "../../helpers"
import { cadService, emitCadEvent, loadAdminCadRequest, loadCadRequestRow } from "../../load"

// POST /admin/cad-requests/:id/release   (Generate now / Release now / Retry)
// Queued → released early (does not use the daily cap). Failed → retried. Either way the row goes
// back to `pending` and `cad_request.released {id, by}` runs the generate path: with review on it
// stops at `review` (Generate now), with review off it emails the link. 409 unless queued or failed.
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const row = await loadCadRequestRow(req.scope, id)
  const conflict = actionConflict("release", row.status)
  if (conflict) return res.status(409).json({ type: "conflict", message: conflict })
  const by = req.auth_context?.actor_id ?? null
  await cadService(req.scope).updateCadRequests(releasePatch(row, by, new Date()))
  await emitCadEvent(req.scope, "cad_request.released", { id, by })
  res.json({ cad_request: await loadAdminCadRequest(req.scope, id) })
}

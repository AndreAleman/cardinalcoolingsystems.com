import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildCadSettingsResponse, cadService } from "../cad-requests/load"
import type { AdminUpdateCadSettingsType } from "./validators"

// GET /admin/cad-settings
//   → {daily_generation_cap, require_review, updated_by, today: {cap_day, generated, queued, review},
//      service: {enabled, healthy, generator_version, tables_hash}}
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  res.json(await buildCadSettingsResponse(req.scope))
}

// POST /admin/cad-settings {daily_generation_cap?: int 0..1000, require_review?: boolean} (at least
// one) → same as GET.
export const POST = async (req: AuthenticatedMedusaRequest<AdminUpdateCadSettingsType>, res: MedusaResponse) => {
  const body = req.validatedBody
  await cadService(req.scope).updateSettings({
    ...(body.daily_generation_cap !== undefined ? { daily_generation_cap: body.daily_generation_cap } : {}),
    ...(body.require_review !== undefined ? { require_review: body.require_review } : {}),
    updated_by: req.auth_context?.actor_id ?? null,
  })
  res.json(await buildCadSettingsResponse(req.scope))
}

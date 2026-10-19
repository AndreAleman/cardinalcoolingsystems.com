import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import type { BuilderType } from "../../../../lib/cpq-shared"
import { resolveBuild, recordConfiguration } from "../lib/resolve-build"
import { resolveBuyer } from "../lib/price-basis"
import type { StoreBuildResolveType } from "../validators"

/*
  POST /store/build/resolve (plan "Backend contracts")

  Body { builder_type, options }. A pure read except the B5 upsert of the
  Configuration, which is fire-and-forget. Auth optional: an Approved
  Company's Team Member is priced on the Company price list, everyone
  else on list price (B2).
*/
export const POST = async (req: AuthenticatedMedusaRequest<StoreBuildResolveType>, res: MedusaResponse) => {
  const { builder_type, options } = req.validatedBody
  const buyer = await resolveBuyer(req.scope, req.auth_context?.actor_id)
  const result = await resolveBuild(req.scope, { builder_type: builder_type as BuilderType, options, buyer })
  void recordConfiguration(req.scope, result, buyer)
  res.json(result)
}

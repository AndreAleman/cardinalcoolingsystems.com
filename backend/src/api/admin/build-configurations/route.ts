import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BUILD_CONFIGURATION_MODULE } from "../../../modules/build-configuration"
import type BuildConfigurationModuleService from "../../../modules/build-configuration/service"
import type { AdminListBuildConfigurationsType } from "./validators"

/*
  GET /admin/build-configurations — every Configuration buyers priced on
  the Builders (plan B5), the "what to stock next" demand signal.
  Filters: builder_type, pricing_mode. Sort: resolve_count (default) or recent.
*/
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const q = req.validatedQuery as unknown as AdminListBuildConfigurationsType
  const service = req.scope.resolve<BuildConfigurationModuleService>(BUILD_CONFIGURATION_MODULE)

  const filters: Record<string, unknown> = {}
  if (q.builder_type) filters.builder_type = q.builder_type
  if (q.pricing_mode) filters.pricing_mode = q.pricing_mode

  const order =
    q.sort === "recent"
      ? { last_resolved_at: "DESC" as const }
      : { resolve_count: "DESC" as const, last_resolved_at: "DESC" as const }

  const [build_configurations, count] = await service.listAndCountBuildConfigurations(filters, {
    order,
    take: q.limit,
    skip: q.offset,
  })

  res.json({ build_configurations, count, limit: q.limit, offset: q.offset })
}

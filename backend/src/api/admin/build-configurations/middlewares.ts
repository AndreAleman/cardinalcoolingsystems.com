import { MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework/http"
import { AdminListBuildConfigurations } from "./validators"

/* /admin is authenticated by Medusa itself; this only validates the query. */
export const adminBuildConfigurationsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/build-configurations",
    methods: ["GET"],
    middlewares: [validateAndTransformQuery(AdminListBuildConfigurations, {})],
  },
]

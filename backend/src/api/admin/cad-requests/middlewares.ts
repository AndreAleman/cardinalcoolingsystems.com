import { type MiddlewareRoute, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http"
import { AdminUpdateCadSettings } from "../cad-settings/validators"
import {
  AdminGetCadRequestParams,
  AdminListCadRequestsParams,
  AdminRejectCadRequest,
  AdminSpamCadRequest,
  AdminUpdateCadRequest,
} from "./validators"

// Admin auth is applied to /admin/* by Medusa; only validation here. /approve, /release and
// /resend take no body; GET /:id/files/:kind takes no query params.
export const adminCadRequestsMiddlewares: MiddlewareRoute[] = [
  {
    methods: ["GET"],
    matcher: "/admin/cad-requests",
    middlewares: [validateAndTransformQuery(AdminListCadRequestsParams, { defaults: ["id"], isList: true })],
  },
  {
    methods: ["GET"],
    matcher: "/admin/cad-requests/:id",
    middlewares: [validateAndTransformQuery(AdminGetCadRequestParams, { defaults: ["id"] })],
  },
  {
    methods: ["POST"],
    matcher: "/admin/cad-requests/:id",
    middlewares: [validateAndTransformBody(AdminUpdateCadRequest)],
  },
  {
    methods: ["POST"],
    matcher: "/admin/cad-requests/:id/reject",
    middlewares: [validateAndTransformBody(AdminRejectCadRequest)],
  },
  {
    methods: ["POST"],
    matcher: "/admin/cad-requests/:id/spam",
    middlewares: [validateAndTransformBody(AdminSpamCadRequest)],
  },
  {
    methods: ["POST"],
    matcher: "/admin/cad-settings",
    // A refined (ZodEffects) schema is passed through the factory form.
    middlewares: [validateAndTransformBody(() => AdminUpdateCadSettings as any)],
  },
]

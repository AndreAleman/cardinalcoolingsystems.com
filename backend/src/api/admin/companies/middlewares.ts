import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { adminCompanyQueryConfig } from "./query-config";
import {
  AdminAssignCompanyPriceList,
  AdminCreateLocation,
  AdminGetCompaniesParams,
  AdminSetInvoicePayment,
  AdminUpdateLocation,
  AdminUpdateTeamMember,
} from "./validators";
import { createSelectParams } from "@medusajs/medusa/api/utils/validators";

const retrieveQuery = validateAndTransformQuery(
  createSelectParams(),
  adminCompanyQueryConfig.retrieve
);

export const adminCompanyMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/companies",
    methods: ["GET"],
    middlewares: [
      validateAndTransformQuery(AdminGetCompaniesParams, adminCompanyQueryConfig.list),
    ],
  },
  { matcher: "/admin/companies/:id", methods: ["GET"], middlewares: [retrieveQuery] },
  { matcher: "/admin/companies/:id/approve", methods: ["POST"], middlewares: [retrieveQuery] },
  { matcher: "/admin/companies/:id/decline", methods: ["POST"], middlewares: [retrieveQuery] },
  {
    matcher: "/admin/companies/:id/price-list",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(AdminAssignCompanyPriceList), retrieveQuery],
  },
  {
    matcher: "/admin/companies/:id/invoice-payment",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(AdminSetInvoicePayment), retrieveQuery],
  },
  {
    matcher: "/admin/companies/:id/team-members/:teamMemberId",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(AdminUpdateTeamMember)],
  },
  {
    matcher: "/admin/companies/:id/locations",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(AdminCreateLocation)],
  },
  {
    matcher: "/admin/companies/:id/locations/:locationId",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(AdminUpdateLocation)],
  },
];

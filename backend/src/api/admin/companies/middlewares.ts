import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { adminCompanyQueryConfig } from "./query-config";
import {
  AdminAssignCompanyPriceList,
  AdminGetCompaniesParams,
  AdminSetInvoicePayment,
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
];

import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { StoreSignupCompanySchema } from "./validators";
import { ensureCompanyApproved } from "../../middlewares/ensure-company-approved";
import { StoreInviteSchema } from "../dashboard/invites/validators";

const dashboardGate = [authenticate("customer", ["session", "bearer"]), ensureCompanyApproved];

export const companyMiddlewares: MiddlewareRoute[] = [
  { matcher: "/store/dashboard", methods: ["GET"], middlewares: dashboardGate },
  { matcher: "/store/dashboard/team", methods: ["GET"], middlewares: dashboardGate },
  { matcher: "/store/dashboard/variants/:id/price", methods: ["GET"], middlewares: dashboardGate },
  {
    matcher: "/store/dashboard/invites",
    methods: ["POST"],
    middlewares: [...dashboardGate, validateAndTransformBody(StoreInviteSchema)],
  },
  {
    matcher: "/store/companies/invites/:token/accept",
    methods: ["POST"],
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    matcher: "/store/companies/me",
    methods: ["GET"],
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    matcher: "/store/companies",
    methods: ["POST"],
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreSignupCompanySchema),
    ],
  },
];

import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { StoreSignupCompanySchema } from "./validators";
import { ensureCompanyApproved } from "../../middlewares/ensure-company-approved";

export const companyMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/dashboard",
    methods: ["GET"],
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      ensureCompanyApproved,
    ],
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

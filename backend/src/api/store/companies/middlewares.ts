import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { StoreSignupCompanySchema } from "./validators";

export const companyMiddlewares: MiddlewareRoute[] = [
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

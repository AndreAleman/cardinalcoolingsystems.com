import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { AdminSetOrderDepositStatus } from "./validators";

/* /admin routes are authenticated by Medusa itself — only body
   validation is added here. */
export const adminOrdersMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/orders/:id/deposit-status",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(AdminSetOrderDepositStatus)],
  },
];

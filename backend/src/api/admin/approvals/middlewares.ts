import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { AdminUpdateApproval } from "./validators";

export const adminApprovalsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/approvals*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/approvals/:id",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(AdminUpdateApproval)],
  },
];

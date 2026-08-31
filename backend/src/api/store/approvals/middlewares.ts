import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { ensureCompanyApproved } from "../../middlewares/ensure-company-approved";
import { ensureEmployeeRole } from "../../middlewares/ensure-employee-role";
import { StoreUpdateApproval, StoreUpdateApprovalSettings } from "./validators";

const dashboardGate = [
  authenticate("customer", ["session", "bearer"]),
  ensureCompanyApproved,
];

export const storeApprovalsMiddlewares: MiddlewareRoute[] = [
  {
    // Every Team Member may read the queue — the route scopes results
    // by Role (members only see their own submissions).
    matcher: "/store/approvals",
    methods: ["GET"],
    middlewares: [...dashboardGate],
  },
  {
    // Only admins and managers decide approvals; members never do.
    matcher: "/store/approvals/:id",
    methods: ["POST"],
    middlewares: [
      ...dashboardGate,
      ensureEmployeeRole("admin", "manager"),
      validateAndTransformBody(StoreUpdateApproval),
    ],
  },
  {
    matcher: "/store/dashboard/approval-settings",
    methods: ["GET"],
    middlewares: [...dashboardGate],
  },
  {
    // The Approval Setting is per Company, editable only by an admin.
    matcher: "/store/dashboard/approval-settings",
    methods: ["POST"],
    middlewares: [
      ...dashboardGate,
      ensureEmployeeRole("admin"),
      validateAndTransformBody(StoreUpdateApprovalSettings),
    ],
  },
];

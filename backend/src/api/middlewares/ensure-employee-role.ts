import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import type { CompanyRequest } from "./ensure-company-approved";
import type { TeamMemberRole } from "../../utils/company-context";

/*
  Role gate for dashboard mutations. Runs AFTER ensureCompanyApproved,
  which already resolved the Team Member's Role from the auth token
  into req.company_context (ADR-0004) — no re-query needed.
*/
export const ensureEmployeeRole = (...allowedRoles: TeamMemberRole[]) => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const role = (req as CompanyRequest).company_context?.role;
    if (role && allowedRoles.includes(role)) {
      return next();
    }
    return res.status(403).json({
      code: "forbidden_role",
      message: "Your Role does not allow this action",
    });
  };
};

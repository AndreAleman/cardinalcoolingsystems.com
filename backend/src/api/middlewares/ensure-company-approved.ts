import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { resolveCompanyContext } from "../../utils/company-context";
import { gateCompany } from "../../utils/company-gate";

/*
  Dashboard data routes sit behind this: 404 for non-Team-Members,
  403 { code: "company_pending" } until Cardinal approves the Company.
  Run after authenticate("customer"). Not applied to
  GET /store/companies/me, which the waiting screen itself needs.
*/
export const ensureCompanyApproved = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const context = await resolveCompanyContext(req.scope, req.auth_context.actor_id);
  let status: "pending" | "approved" | "declined" | null = null;
  if (context) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "status"],
      filters: { id: context.companyId },
    });
    status = (company?.status as typeof status) ?? null;
  }
  const gate = gateCompany(context, status);
  if (gate.ok === false) {
    return res.status(gate.http).json({ code: gate.code, message: gateMessage(gate.code) });
  }
  (req as any).company_context = gate.context;
  return next();
};

function gateMessage(code: string) {
  switch (code) {
    case "company_pending":
      return "Your Company is waiting for Cardinal's approval";
    case "company_declined":
      return "Your Company was not approved";
    default:
      return "You are not a Team Member of any Company";
  }
}

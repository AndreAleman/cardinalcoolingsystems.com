import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import type { CompanyRequest } from "../../middlewares/ensure-company-approved";
import { loadCompanyForStore } from "../companies/load-company";

/*
  GET /store/dashboard — the Dashboard's bootstrap call. Sits behind
  ensureCompanyApproved, so a Pending Company gets 403 company_pending.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ctx = (req as CompanyRequest).company_context;
  const company = await loadCompanyForStore(req.scope, ctx.companyId);
  res.json({ company, role: ctx.role });
};

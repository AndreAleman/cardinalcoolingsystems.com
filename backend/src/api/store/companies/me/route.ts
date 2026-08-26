import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { resolveCompanyContext } from "../../../../utils/company-context";
import { loadCompanyForStore } from "../load-company";

/*
  GET /store/companies/me — the signed-in Team Member's Company.
  Read-only, so no workflow. 404 when the customer is not a Team Member.
  Works for a Pending Company on purpose: the waiting screen needs it.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ctx = await resolveCompanyContext(req.scope, req.auth_context.actor_id);
  if (!ctx) {
    return res
      .status(404)
      .json({ message: "You are not a Team Member of any Company" });
  }
  const company = await loadCompanyForStore(req.scope, ctx.companyId);
  return res.json({ company, role: ctx.role });
};

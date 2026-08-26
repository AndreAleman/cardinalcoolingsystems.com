import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { decideCompanyWorkflow } from "../../../workflows/company/decide-company";
import type { CompanyDecision } from "../../../modules/company/types/status";
import { retrieveAdminCompany } from "./retrieve";

/* Shared handler for POST /admin/companies/:id/{approve,decline}. */
export const decideCompany =
  (status: CompanyDecision) =>
  async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
    await decideCompanyWorkflow(req.scope).run({
      input: { company_id: req.params.id, status },
    });
    res.json({ company: await retrieveAdminCompany(req, req.params.id) });
  };

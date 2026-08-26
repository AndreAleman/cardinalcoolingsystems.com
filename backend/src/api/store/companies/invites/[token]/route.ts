import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../../../../modules/company";
import CompanyModuleService from "../../../../../modules/company/service";
import { inviteProblem } from "../../../../../utils/invite-validity";

/*
  GET /store/companies/invites/:token — what the accept page shows
  before the person signs in: which Company, which email. Public.
*/
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const companyService = req.scope.resolve<CompanyModuleService>(COMPANY_MODULE);
  const [invite] = await companyService.listCompanyInvites({ token: req.params.token });
  const problem = invite ? inviteProblem(invite, invite.email, new Date()) : "not_found";
  if (problem) {
    return res.status(404).json({ code: problem, message: "This invite link is not valid" });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [company],
  } = await query.graph({ entity: "company", fields: ["id", "name"], filters: { id: invite.company_id } });

  res.json({
    invite: { email: invite.email, company_name: company?.name, expires_at: invite.expires_at },
  });
};

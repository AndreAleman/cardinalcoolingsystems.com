import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { resolveCompanyContext } from "../../../../utils/company-context";

/*
  GET /store/companies/me — the signed-in Team Member's Company.
  Read-only, so no workflow. 404 when the customer is not a Team Member.
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

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: [
      "id",
      "name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zip",
      "country",
      "logo_url",
      "currency_code",
    ],
    filters: { id: ctx.companyId },
  });

  return res.json({ company, role: ctx.role });
};

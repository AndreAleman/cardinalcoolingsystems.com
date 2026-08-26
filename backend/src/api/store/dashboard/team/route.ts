import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { inviteProblem } from "../../../../utils/invite-validity";

/* GET /store/dashboard/team — Team Members and open Invites. Never the token. */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ctx = (req as CompanyRequest).company_context;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: [
      "id",
      "employees.id",
      "employees.role",
      "employees.customer.id",
      "employees.customer.email",
      "employees.customer.first_name",
      "employees.customer.last_name",
      "invites.id",
      "invites.email",
      "invites.expires_at",
      "invites.accepted_at",
    ],
    filters: { id: ctx.companyId },
  });

  const now = new Date();
  const invites = ((company as any)?.invites ?? [])
    .filter((i: any) => inviteProblem(i, i.email, now) === null)
    .map((i: any) => ({ id: i.id, email: i.email, expires_at: i.expires_at }));

  res.json({ team: (company as any)?.employees ?? [], invites });
};

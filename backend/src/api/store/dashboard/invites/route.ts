import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { inviteTeamMemberWorkflow } from "../../../../workflows/company/invite-team-member";
import { StoreInviteType } from "./validators";
import { customerDisplayName } from "../../../../utils/display-name";

/* POST /store/dashboard/invites — invite a coworker by email. */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreInviteType>,
  res: MedusaResponse
) => {
  const ctx = (req as CompanyRequest).company_context;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const [{ data: [company] }, { data: [customer] }] = await Promise.all([
    query.graph({ entity: "company", fields: ["id", "name"], filters: { id: ctx.companyId } }),
    query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { id: req.auth_context.actor_id },
    }),
  ]);

  const inviterName = customerDisplayName(customer);

  const { result } = await inviteTeamMemberWorkflow(req.scope).run({
    input: {
      company: { id: company.id, name: company.name },
      email: req.validatedBody.email,
      inviter: { id: customer.id, name: inviterName },
    },
  });

  res.status(201).json({
    invite: { id: result.id, email: result.email, expires_at: result.expires_at },
  });
};

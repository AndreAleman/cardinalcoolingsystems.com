import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { acceptInviteWorkflow } from "../../../../../../workflows/company/accept-invite";
import { loadCompanyForStore } from "../../../load-company";

/* POST /store/companies/invites/:token/accept — the signed-in customer joins. */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email"],
    filters: { id: req.auth_context.actor_id },
  });

  const { result } = await acceptInviteWorkflow(req.scope).run({
    input: { token: req.params.token, customer: { id: customer.id, email: customer.email } },
  });

  const company = await loadCompanyForStore(req.scope, result.company_id);
  res.json({ company, role: result.role });
};

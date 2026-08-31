import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { resolveCompanyContext } from "../../../utils/company-context";
import { loadCompanyForStore } from "./load-company";
import { signupCompanyWorkflow } from "../../../workflows/company/signup-company";
import { StoreSignupCompanyType } from "./validators";

/*
  POST /store/companies — a signed-in customer creates their Pending
  Company and becomes its admin Team Member. Returns the Welcome Code
  so the storefront can show it immediately.
*/
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreSignupCompanyType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name"],
    filters: { id: req.auth_context.actor_id },
  });

  const { result } = await signupCompanyWorkflow(req.scope).run({
    input: {
      name: req.validatedBody.name,
      phone: req.validatedBody.phone,
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
      },
    },
  });

  const [company, ctx] = await Promise.all([
    loadCompanyForStore(req.scope, result.company.id),
    resolveCompanyContext(req.scope, customer.id),
  ]);

  return res.status(201).json({
    company,
    role: ctx?.role,
    welcome_code: result.welcome.code,
  });
};
